drop policy if exists "Community managers can update listings in own community" on public.listings;
create policy "Community managers can update listings in own community"
on public.listings for update to authenticated
using (
  public.is_super_admin()
  or (
    community_id = public.my_community_id()
    and public.can_manage_own_community()
  )
)
with check (
  public.is_super_admin()
  or (
    community_id = public.my_community_id()
    and public.can_manage_own_community()
  )
);

drop policy if exists "Community managers can delete listings in own community" on public.listings;
create policy "Community managers can delete listings in own community"
on public.listings for delete to authenticated
using (
  public.is_super_admin()
  or (
    community_id = public.my_community_id()
    and public.can_manage_own_community()
  )
);

grant select, insert, update, delete on table public.listings to authenticated;
notify pgrst, 'reload schema';
