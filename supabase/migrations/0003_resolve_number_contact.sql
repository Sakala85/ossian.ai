-- Return the dealership's contact email with the number resolution (team notifications by email).
create or replace function public.ossian_resolve_number(p_key text, p_e164 text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  r record;
begin
  perform private.assert_server_key(p_key);
  select d.id, d.org_id, d.profile, d.fallback_number, d.contact_email into r
  from public.phone_numbers p
  join public.dealerships d on d.id = p.dealership_id
  where p.e164 = p_e164 and p.status = 'assigned' and d.status in ('live', 'testing');
  if not found then
    return null;
  end if;
  return jsonb_build_object('dealership_id', r.id, 'org_id', r.org_id, 'profile', r.profile,
    'fallback_number', r.fallback_number, 'contact_email', r.contact_email);
end $$;
