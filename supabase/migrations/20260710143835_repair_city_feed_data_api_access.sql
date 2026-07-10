do $$
begin
  if to_regclass('public.city_publications') is not null then
    grant select, insert, update, delete on table public.city_publications to authenticated;
    grant select, insert, update, delete on table public.city_publications to service_role;
  end if;

  if to_regprocedure('public.my_community_city_key()') is not null then
    revoke execute on function public.my_community_city_key() from public, anon;
    grant execute on function public.my_community_city_key() to authenticated;
    grant execute on function public.my_community_city_key() to service_role;
  end if;
end $$;

notify pgrst, 'reload schema';
