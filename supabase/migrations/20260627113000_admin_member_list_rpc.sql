create or replace function public.admin_list_members(requested_status text default null)
returns table (
  id uuid,
  community_id uuid,
  email text,
  display_name text,
  full_name text,
  unit_number text,
  membership_status text,
  is_verified boolean,
  created_at timestamptz,
  role text,
  phone text,
  whatsapp_number text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_community uuid;
begin
  if requested_status is not null and requested_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Unsupported member status';
  end if;

  if not public.is_super_admin() and not public.can_manage_own_community() then
    raise exception 'Administrator access required';
  end if;

  actor_community := public.my_community_id();

  return query
  select
    p.id,
    p.community_id,
    p.email,
    p.display_name,
    p.full_name,
    p.unit_number,
    p.membership_status,
    p.is_verified,
    p.created_at,
    coalesce(
      (
        select ur.role::text
        from public.user_roles ur
        where ur.user_id = p.id
        order by
          case ur.role::text
            when 'admin' then 1
            when 'moderator' then 2
            else 3
          end
        limit 1
      ),
      'user'
    ) as role,
    pp.phone,
    pp.whatsapp_number
  from public.profiles p
  left join public.private_profiles pp on pp.id = p.id
  where (public.is_super_admin() or p.community_id = actor_community)
    and (requested_status is null or p.membership_status = requested_status)
  order by
    case p.membership_status
      when 'pending' then 1
      when 'approved' then 2
      when 'rejected' then 3
      else 4
    end,
    p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_members(text) from public, anon;
grant execute on function public.admin_list_members(text) to authenticated;
