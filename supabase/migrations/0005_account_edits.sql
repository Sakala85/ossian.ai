-- Edits made by a dealership from its dashboard, scoped by its private access token.

-- Saves the dealership profile (agent, hours, services, routing…) used on the next call.
create or replace function public.ossian_update_profile(p_key text, p_token text, p_profile jsonb, p_fallback text default null)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  t public.access_tokens;
  v_name text;
begin
  perform private.assert_server_key(p_key);
  t := private.token_row(p_token);
  if t.token_hash is null then
    raise exception 'invalid_token' using errcode = '42501';
  end if;
  if jsonb_typeof(p_profile) is distinct from 'object' or jsonb_typeof(p_profile -> 'agent') is distinct from 'object' then
    raise exception 'invalid_profile' using errcode = '22023';
  end if;

  select coalesce(nullif(trim(p_profile ->> 'name'), ''), d.name) into v_name from public.dealerships d where d.id = t.dealership_id;

  update public.dealerships
  set name = v_name,
      website = nullif(trim(p_profile ->> 'website'), ''),
      profile = jsonb_set(jsonb_set(p_profile, '{id}', to_jsonb(t.dealership_id::text)), '{name}', to_jsonb(v_name)),
      agent = p_profile -> 'agent',
      fallback_number = case when p_fallback is null then fallback_number else nullif(trim(p_fallback), '') end,
      updated_at = now()
  where id = t.dealership_id;

  return jsonb_build_object('ok', true, 'updated_at', now());
end $$;

-- Follow-up of what the agent captured: appointment status, lead stage, callback done / to do.
create or replace function public.ossian_update_item(p_key text, p_token text, p_kind text, p_id uuid, p_value text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  t public.access_tokens;
begin
  perform private.assert_server_key(p_key);
  t := private.token_row(p_token);
  if t.token_hash is null then
    raise exception 'invalid_token' using errcode = '42501';
  end if;

  if p_kind = 'appointment' then
    if p_value not in ('confirme', 'en_attente', 'honore', 'no_show', 'annule') then
      raise exception 'invalid_value' using errcode = '22023';
    end if;
    update public.appointments set status = p_value where id = p_id and dealership_id = t.dealership_id;
  elsif p_kind = 'lead' then
    if p_value not in ('nouveau', 'contacte', 'essai', 'offre', 'gagne', 'perdu') then
      raise exception 'invalid_value' using errcode = '22023';
    end if;
    update public.leads set stage = p_value where id = p_id and dealership_id = t.dealership_id;
  elsif p_kind = 'callback' then
    if p_value not in ('done', 'open') then
      raise exception 'invalid_value' using errcode = '22023';
    end if;
    update public.callbacks set done_at = case when p_value = 'done' then now() else null end
    where id = p_id and dealership_id = t.dealership_id;
  else
    raise exception 'unknown_kind' using errcode = '22023';
  end if;

  return found;
end $$;

revoke all on function public.ossian_update_profile(text, text, jsonb, text) from public;
revoke all on function public.ossian_update_item(text, text, text, uuid, text) from public;
grant execute on function public.ossian_update_profile(text, text, jsonb, text) to anon, authenticated, service_role;
grant execute on function public.ossian_update_item(text, text, text, uuid, text) to anon, authenticated, service_role;
