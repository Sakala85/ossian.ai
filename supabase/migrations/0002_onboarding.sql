-- Ossian — one-click onboarding
-- * pool of pre-provisioned phone numbers (instant assignment, no regulatory wait at signup)
-- * private access links to the dashboard (no password, no email round-trip)
-- * server API exposed as RPC functions guarded by a server key (the app never needs the
--   service-role key; tables stay closed to anon/authenticated by RLS)

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.settings (
  key text primary key,
  value text not null
);

-- ---------------------------------------------------------------------------
-- Schema changes
-- ---------------------------------------------------------------------------
alter table public.organizations add column if not exists owner_email text;
alter table public.dealerships add column if not exists contact_email text;
alter table public.dealerships add column if not exists fallback_number text;

alter table public.phone_numbers alter column org_id drop not null;
alter table public.phone_numbers alter column dealership_id drop not null;
alter table public.phone_numbers add column if not exists status text not null default 'available';
alter table public.phone_numbers drop constraint if exists phone_numbers_status_check;
alter table public.phone_numbers add constraint phone_numbers_status_check check (status in ('available', 'assigned', 'released'));
alter table public.phone_numbers drop constraint if exists phone_numbers_provider_check;
alter table public.phone_numbers add constraint phone_numbers_provider_check check (provider in ('vapi', 'vonage', 'twilio', 'telnyx', 'sip'));
alter table public.phone_numbers add column if not exists vapi_phone_number_id text unique;
alter table public.phone_numbers add column if not exists assigned_at timestamptz;
alter table public.phone_numbers add column if not exists first_call_at timestamptz;
create index if not exists phone_numbers_pool_idx on public.phone_numbers (status, created_at);

create table if not exists public.access_tokens (
  token_hash text primary key,
  org_id uuid not null references public.organizations(id) on delete cascade,
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
-- No policy on purpose: only reachable through the security-definer functions below.
alter table public.access_tokens enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers (private)
-- ---------------------------------------------------------------------------
create or replace function private.assert_server_key(p_key text)
returns void
language plpgsql stable security definer set search_path = ''
as $$
declare
  expected text;
begin
  select value into expected from private.settings where key = 'server_key_sha256';
  if expected is null or p_key is null or encode(extensions.digest(p_key, 'sha256'), 'hex') <> expected then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
end $$;

create or replace function private.token_row(p_token text)
returns public.access_tokens
language sql stable security definer set search_path = ''
as $$
  select * from public.access_tokens
  where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') and revoked_at is null
$$;

-- ---------------------------------------------------------------------------
-- RPC API (called by the Next.js server with the publishable key + server key)
-- ---------------------------------------------------------------------------

-- Creates organization + dealership + sites, claims a pool number, returns a private access token.
create or replace function public.ossian_activate(p_key text, p_profile jsonb, p_email text, p_fallback text default null, p_source text default 'ai')
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_org uuid;
  v_dealer uuid;
  v_token text;
  v_phone public.phone_numbers;
  v_name text := coalesce(nullif(trim(p_profile ->> 'name'), ''), 'Ma concession');
  v_site jsonb;
begin
  perform private.assert_server_key(p_key);
  if p_email is null or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  insert into public.organizations (name, owner_email, plan)
  values (coalesce(nullif(trim(p_profile ->> 'group'), ''), v_name), lower(p_email), 'trial')
  returning id into v_org;

  insert into public.dealerships (org_id, name, website, profile, agent, status, source, contact_email, fallback_number, live_at)
  values (
    v_org, v_name, p_profile ->> 'website', p_profile, coalesce(p_profile -> 'agent', '{}'::jsonb), 'live',
    case when p_source in ('ai', 'manual', 'simulated') then p_source else 'ai' end,
    lower(p_email), nullif(trim(p_fallback), ''), now()
  )
  returning id into v_dealer;

  -- The stored profile carries its database id.
  update public.dealerships set profile = jsonb_set(profile, '{id}', to_jsonb(v_dealer::text)) where id = v_dealer;

  for v_site in select value from jsonb_array_elements(case when jsonb_typeof(p_profile -> 'sites') = 'array' then p_profile -> 'sites' else '[]'::jsonb end)
  loop
    insert into public.sites (org_id, dealership_id, name, address, city, phone, brands)
    values (
      v_org, v_dealer, coalesce(nullif(v_site ->> 'name', ''), v_name), v_site ->> 'address', v_site ->> 'city', v_site ->> 'phone',
      case when jsonb_typeof(v_site -> 'brands') = 'array' then array(select jsonb_array_elements_text(v_site -> 'brands')) else '{}'::text[] end
    );
  end loop;

  -- Instant number: take the oldest available number of the pool (concurrency-safe).
  update public.phone_numbers
  set status = 'assigned', org_id = v_org, dealership_id = v_dealer, assigned_at = now()
  where id = (
    select id from public.phone_numbers where status = 'available' order by created_at limit 1 for update skip locked
  )
  returning * into v_phone;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.access_tokens (token_hash, org_id, dealership_id, email)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), v_org, v_dealer, lower(p_email));

  return jsonb_build_object(
    'org_id', v_org,
    'dealership_id', v_dealer,
    'token', v_token,
    'phone', case when v_phone.id is null then null
                  else jsonb_build_object('e164', v_phone.e164, 'vapi_phone_number_id', v_phone.vapi_phone_number_id) end
  );
end $$;

-- Which dealership answers on this number (null if unassigned).
create or replace function public.ossian_resolve_number(p_key text, p_e164 text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  r record;
begin
  perform private.assert_server_key(p_key);
  select d.id, d.org_id, d.profile, d.fallback_number into r
  from public.phone_numbers p
  join public.dealerships d on d.id = p.dealership_id
  where p.e164 = p_e164 and p.status = 'assigned' and d.status in ('live', 'testing');
  if not found then
    return null;
  end if;
  return jsonb_build_object('dealership_id', r.id, 'org_id', r.org_id, 'profile', r.profile, 'fallback_number', r.fallback_number);
end $$;

-- Records the first call received on a number (= call forwarding verified). Returns true the first time.
create or replace function public.ossian_mark_first_call(p_key text, p_e164 text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.assert_server_key(p_key);
  update public.phone_numbers set first_call_at = now()
  where e164 = p_e164 and status = 'assigned' and first_call_at is null;
  return found;
end $$;

create or replace function public.ossian_log_call(p_key text, p_dealership uuid, p_call jsonb)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_org uuid;
  v_id uuid;
begin
  perform private.assert_server_key(p_key);
  select org_id into v_org from public.dealerships where id = p_dealership;
  if v_org is null then
    raise exception 'unknown_dealership' using errcode = '22023';
  end if;

  insert into public.calls (
    org_id, dealership_id, provider_call_id, direction, caller_number, caller_name, started_at, duration_sec,
    language, intent, outcome, sentiment, after_hours, summary, extracted, transcript, recording_url
  )
  values (
    v_org, p_dealership, p_call ->> 'provider_call_id', coalesce(p_call ->> 'direction', 'inbound'),
    p_call ->> 'caller_number', p_call ->> 'caller_name', coalesce((p_call ->> 'started_at')::timestamptz, now()),
    (p_call ->> 'duration_sec')::int, p_call ->> 'language', p_call ->> 'intent', p_call ->> 'outcome', p_call ->> 'sentiment',
    coalesce((p_call ->> 'after_hours')::boolean, false), p_call ->> 'summary',
    coalesce(p_call -> 'extracted', '{}'::jsonb), coalesce(p_call -> 'transcript', '[]'::jsonb), p_call ->> 'recording_url'
  )
  on conflict (provider_call_id) do update set
    summary = coalesce(excluded.summary, public.calls.summary),
    transcript = excluded.transcript,
    duration_sec = coalesce(excluded.duration_sec, public.calls.duration_sec),
    recording_url = coalesce(excluded.recording_url, public.calls.recording_url),
    outcome = coalesce(excluded.outcome, public.calls.outcome),
    intent = coalesce(excluded.intent, public.calls.intent)
  returning id into v_id;
  return v_id;
end $$;

-- Business events captured during a call: appointment request, lead, callback.
create or replace function public.ossian_log_event(p_key text, p_dealership uuid, p_kind text, p_data jsonb)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_org uuid;
  v_id uuid;
begin
  perform private.assert_server_key(p_key);
  select org_id into v_org from public.dealerships where id = p_dealership;
  if v_org is null then
    raise exception 'unknown_dealership' using errcode = '22023';
  end if;

  if p_kind = 'appointment' then
    insert into public.appointments (org_id, dealership_id, customer_name, phone, vehicle, service, starts_at, duration_min, courtesy_vehicle, status, source)
    values (
      v_org, p_dealership, coalesce(p_data ->> 'customer_name', 'Client'), coalesce(p_data ->> 'phone', ''),
      jsonb_strip_nulls(jsonb_build_object('label', p_data ->> 'vehicle', 'plate', p_data ->> 'plate', 'mileage', p_data ->> 'mileage')),
      coalesce(p_data ->> 'service', 'Atelier'), coalesce((p_data ->> 'starts_at')::timestamptz, now()),
      coalesce((p_data ->> 'duration_min')::int, 60), coalesce((p_data ->> 'courtesy_vehicle')::boolean, false), 'en_attente', 'ossian'
    )
    returning id into v_id;
  elsif p_kind = 'lead' then
    insert into public.leads (org_id, dealership_id, name, phone, email, interest, vehicle, budget, trade_in, stage, note, source)
    values (
      v_org, p_dealership, coalesce(p_data ->> 'name', 'Prospect'), coalesce(p_data ->> 'phone', ''), p_data ->> 'email',
      case when p_data ->> 'interest' in ('VN', 'VO', 'Reprise', 'Financement', 'LLD') then p_data ->> 'interest' else 'VN' end,
      p_data ->> 'vehicle', round((p_data ->> 'budget')::numeric)::int, p_data ->> 'trade_in', 'nouveau', p_data ->> 'notes', 'appel entrant'
    )
    returning id into v_id;
  elsif p_kind = 'callback' then
    insert into public.callbacks (org_id, dealership_id, department, name, phone, reason, priority)
    values (
      v_org, p_dealership, coalesce(p_data ->> 'department', 'accueil'), p_data ->> 'name', coalesce(p_data ->> 'phone', ''),
      coalesce(p_data ->> 'reason', 'Rappel demandé'),
      case when p_data ->> 'priority' = 'haute' then 'haute' else 'normale' end
    )
    returning id into v_id;
  else
    raise exception 'unknown_kind' using errcode = '22023';
  end if;
  return v_id;
end $$;

-- Everything the dashboard needs for the dealership behind an access token.
create or replace function public.ossian_dashboard(p_key text, p_token text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  t public.access_tokens;
begin
  perform private.assert_server_key(p_key);
  t := private.token_row(p_token);
  if t.token_hash is null then
    return null;
  end if;
  update public.access_tokens set last_used_at = now() where token_hash = t.token_hash;

  return jsonb_build_object(
    'dealership', (
      select jsonb_build_object('id', d.id, 'name', d.name, 'agent_name', d.agent ->> 'name', 'website', d.website,
        'contact_email', d.contact_email, 'fallback_number', d.fallback_number, 'created_at', d.created_at, 'profile', d.profile)
      from public.dealerships d where d.id = t.dealership_id
    ),
    'phone', (
      select jsonb_build_object('e164', p.e164, 'assigned_at', p.assigned_at, 'first_call_at', p.first_call_at)
      from public.phone_numbers p where p.dealership_id = t.dealership_id and p.status = 'assigned'
      order by p.assigned_at desc limit 1
    ),
    'calls', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.started_at desc) from (
        select id, provider_call_id, direction, caller_number, caller_name, started_at, duration_sec, language, intent, outcome,
          sentiment, after_hours, summary, extracted, transcript, recording_url
        from public.calls where dealership_id = t.dealership_id order by started_at desc limit 200
      ) c), '[]'::jsonb),
    'appointments', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.created_at desc) from (
        select id, customer_name, phone, vehicle, service, starts_at, duration_min, courtesy_vehicle, status, source, created_at
        from public.appointments where dealership_id = t.dealership_id order by created_at desc limit 200
      ) a), '[]'::jsonb),
    'leads', coalesce((
      select jsonb_agg(to_jsonb(l) order by l.created_at desc) from (
        select id, name, phone, email, interest, vehicle, budget, trade_in, stage, note, created_at
        from public.leads where dealership_id = t.dealership_id order by created_at desc limit 200
      ) l), '[]'::jsonb),
    'callbacks', coalesce((
      select jsonb_agg(to_jsonb(b) order by b.created_at desc) from (
        select id, department, name, phone, reason, priority, done_at, created_at
        from public.callbacks where dealership_id = t.dealership_id order by created_at desc limit 200
      ) b), '[]'::jsonb)
  );
end $$;

-- Admin: add a Vapi number (already pointing to Ossian's webhook) to the pool.
create or replace function public.ossian_pool_add(p_key text, p_e164 text, p_vapi_id text, p_provider text default 'vapi')
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  r public.phone_numbers;
begin
  perform private.assert_server_key(p_key);
  insert into public.phone_numbers (e164, provider, provider_ref, vapi_phone_number_id, status)
  values (p_e164, coalesce(p_provider, 'vapi'), p_vapi_id, p_vapi_id, 'available')
  on conflict (e164) do update set vapi_phone_number_id = excluded.vapi_phone_number_id, provider_ref = excluded.provider_ref
  returning * into r;
  return jsonb_build_object('id', r.id, 'e164', r.e164, 'status', r.status);
end $$;

create or replace function public.ossian_pool_status(p_key text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform private.assert_server_key(p_key);
  return jsonb_build_object(
    'available', (select count(*) from public.phone_numbers where status = 'available'),
    'assigned', (select count(*) from public.phone_numbers where status = 'assigned')
  );
end $$;

revoke all on function public.ossian_activate(text, jsonb, text, text, text) from public;
revoke all on function public.ossian_resolve_number(text, text) from public;
revoke all on function public.ossian_mark_first_call(text, text) from public;
revoke all on function public.ossian_log_call(text, uuid, jsonb) from public;
revoke all on function public.ossian_log_event(text, uuid, text, jsonb) from public;
revoke all on function public.ossian_dashboard(text, text) from public;
revoke all on function public.ossian_pool_add(text, text, text, text) from public;
revoke all on function public.ossian_pool_status(text) from public;
grant execute on function public.ossian_activate(text, jsonb, text, text, text) to anon, authenticated, service_role;
grant execute on function public.ossian_resolve_number(text, text) to anon, authenticated, service_role;
grant execute on function public.ossian_mark_first_call(text, text) to anon, authenticated, service_role;
grant execute on function public.ossian_log_call(text, uuid, jsonb) to anon, authenticated, service_role;
grant execute on function public.ossian_log_event(text, uuid, text, jsonb) to anon, authenticated, service_role;
grant execute on function public.ossian_dashboard(text, text) to anon, authenticated, service_role;
grant execute on function public.ossian_pool_add(text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.ossian_pool_status(text) to anon, authenticated, service_role;

-- The server key is set outside of migrations (secret), e.g.:
-- insert into private.settings (key, value) values ('server_key_sha256', encode(extensions.digest('<OSSIAN_DB_KEY>', 'sha256'), 'hex'))
-- on conflict (key) do update set value = excluded.value;
