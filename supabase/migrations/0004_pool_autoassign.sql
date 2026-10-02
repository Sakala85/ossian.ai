-- Adding a number to the pool hands it straight to the oldest dealership that
-- activated while the pool was empty, so ops never assigns numbers by hand.

create or replace function public.ossian_pool_add(p_key text, p_e164 text, p_vapi_id text, p_provider text default 'vapi')
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  r public.phone_numbers;
  w record;
begin
  perform private.assert_server_key(p_key);
  insert into public.phone_numbers (e164, provider, provider_ref, vapi_phone_number_id, status)
  values (p_e164, coalesce(p_provider, 'vapi'), p_vapi_id, p_vapi_id, 'available')
  on conflict (e164) do update set vapi_phone_number_id = excluded.vapi_phone_number_id, provider_ref = excluded.provider_ref
  returning * into r;

  if r.status = 'available' then
    select d.id, d.org_id, d.name, d.contact_email, d.fallback_number
    into w
    from public.dealerships d
    where d.status in ('live', 'testing')
      and not exists (select 1 from public.phone_numbers p where p.dealership_id = d.id and p.status = 'assigned')
    order by d.created_at
    limit 1
    for update skip locked;

    if found then
      update public.phone_numbers
      set status = 'assigned', org_id = w.org_id, dealership_id = w.id, assigned_at = now()
      where id = r.id
      returning * into r;
      return jsonb_build_object(
        'id', r.id, 'e164', r.e164, 'status', r.status,
        'assigned_to', jsonb_build_object('dealership_id', w.id, 'name', w.name, 'email', w.contact_email, 'fallback', w.fallback_number)
      );
    end if;
  end if;

  return jsonb_build_object('id', r.id, 'e164', r.e164, 'status', r.status, 'assigned_to', null);
end $$;

revoke all on function public.ossian_pool_add(text, text, text, text) from public;
grant execute on function public.ossian_pool_add(text, text, text, text) to anon, authenticated, service_role;
