-- Ossian — initial schema (Postgres / Supabase)
-- Multi-tenant: organization (groupe) → dealerships (concessions) → sites.
-- Every tenant table carries org_id and is protected by RLS.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tenancy
-- ---------------------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'trial' check (plan in ('trial', 'essentiel', 'performance', 'groupe')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

create table members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'manager' check (role in ('owner', 'admin', 'manager', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create or replace function is_member(target_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from members m where m.org_id = target_org and m.user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Dealership profile (output of onboarding) and agent configuration
-- ---------------------------------------------------------------------------
create table dealerships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  website text,
  -- Full DealershipProfile (lib/domain/types.ts): hours, services, departments, policies, faq.
  profile jsonb not null,
  -- AgentConfig: name, voice, languages, tone, greeting, transfer policy…
  agent jsonb not null,
  status text not null default 'onboarding' check (status in ('onboarding', 'testing', 'live', 'paused')),
  source text not null default 'ai' check (source in ('ai', 'manual', 'simulated')),
  live_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  dealership_id uuid not null references dealerships(id) on delete cascade,
  name text not null,
  address text,
  city text,
  phone text,
  brands text[] not null default '{}'
);

create table phone_numbers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  dealership_id uuid not null references dealerships(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  e164 text not null unique,
  provider text not null default 'vapi' check (provider in ('vapi', 'twilio', 'telnyx', 'sip')),
  provider_ref text,
  mode text not null default 'overflow' check (mode in ('overflow', 'after_hours', 'always', 'dedicated')),
  created_at timestamptz not null default now()
);

create table integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  dealership_id uuid references dealerships(id) on delete cascade,
  kind text not null, -- 'nextlane' | 'keyloop' | 'kerridge' | 'cdk' | 'gcal' | 'outlook' | 'salesforce' | 'hubspot' | 'slack' | 'webhook'
  status text not null default 'pending' check (status in ('pending', 'connected', 'error', 'disabled')),
  -- Secrets live in Supabase Vault; only the reference is stored here.
  secret_ref text,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Activity
-- ---------------------------------------------------------------------------
create table calls (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  dealership_id uuid not null references dealerships(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  provider_call_id text unique,
  direction text not null check (direction in ('inbound', 'outbound')),
  caller_number text,
  caller_name text,
  started_at timestamptz not null,
  duration_sec int,
  language text,
  intent text,
  outcome text check (outcome in ('rdv_pris', 'lead_cree', 'transfere', 'info_donnee', 'rappel_programme', 'abandonne')),
  sentiment text check (sentiment in ('positif', 'neutre', 'negatif')),
  after_hours boolean not null default false,
  summary text,
  extracted jsonb not null default '{}',
  transcript jsonb not null default '[]', -- TranscriptLine[] incl. tool events
  recording_url text,
  csat smallint check (csat between 1 and 5),
  created_at timestamptz not null default now()
);
create index calls_org_started_idx on calls (org_id, started_at desc);
create index calls_dealership_intent_idx on calls (dealership_id, intent);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  dealership_id uuid not null references dealerships(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  call_id uuid references calls(id) on delete set null,
  external_ref text, -- DMS appointment id
  customer_name text not null,
  phone text not null,
  vehicle jsonb not null default '{}',
  service text not null,
  starts_at timestamptz not null,
  duration_min int not null default 60,
  advisor text,
  courtesy_vehicle boolean not null default false,
  status text not null default 'confirme' check (status in ('confirme', 'en_attente', 'honore', 'no_show', 'annule')),
  source text not null default 'ossian' check (source in ('ossian', 'manuel')),
  estimated_value numeric(10, 2),
  created_at timestamptz not null default now()
);
create index appointments_org_start_idx on appointments (org_id, starts_at);

create table leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  dealership_id uuid not null references dealerships(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  call_id uuid references calls(id) on delete set null,
  external_ref text, -- CRM id
  name text not null,
  phone text not null,
  email text,
  interest text not null check (interest in ('VN', 'VO', 'Reprise', 'Financement', 'LLD')),
  vehicle text,
  budget int,
  trade_in text,
  stage text not null default 'nouveau' check (stage in ('nouveau', 'contacte', 'essai', 'offre', 'gagne', 'perdu')),
  score smallint,
  assignee text,
  note text,
  source text not null default 'appel entrant',
  created_at timestamptz not null default now()
);

create table callbacks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  dealership_id uuid not null references dealerships(id) on delete cascade,
  call_id uuid references calls(id) on delete set null,
  department text not null,
  name text,
  phone text not null,
  reason text not null,
  priority text not null default 'normale' check (priority in ('normale', 'haute')),
  due_at timestamptz,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  dealership_id uuid not null references dealerships(id) on delete cascade,
  name text not null,
  type text not null check (type in ('rappel_entretien', 'relance_devis', 'satisfaction', 'no_show', 'relance_lead', 'rappel_ct')),
  status text not null default 'brouillon' check (status in ('brouillon', 'planifiee', 'active', 'terminee')),
  channels text[] not null default '{voix}',
  script jsonb not null default '{}',
  schedule jsonb not null default '{}', -- call windows, retries, quiet hours (respect Bloctel / opposition)
  created_at timestamptz not null default now()
);

create table campaign_targets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text,
  phone text not null,
  payload jsonb not null default '{}',
  status text not null default 'a_appeler' check (status in ('a_appeler', 'appele', 'joint', 'converti', 'echec', 'opposition')),
  attempts smallint not null default 0,
  last_call_id uuid references calls(id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['dealerships', 'sites', 'phone_numbers', 'integrations', 'calls', 'appointments', 'leads', 'callbacks', 'campaigns', 'campaign_targets']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for all using (is_member(org_id)) with check (is_member(org_id))', t || '_member_all', t);
  end loop;
end $$;

alter table organizations enable row level security;
create policy organizations_member_read on organizations for select using (is_member(id));

alter table members enable row level security;
create policy members_self_read on members for select using (user_id = auth.uid() or is_member(org_id));
