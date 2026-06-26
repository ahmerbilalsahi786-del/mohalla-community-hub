create or replace function public.protect_community_settings_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  signup_requester_link boolean;
begin
  if public.is_super_admin() then
    return new;
  end if;

  signup_requester_link :=
    old.status = 'pending'
    and new.status = 'pending'
    and old.requested_by_user_id is null
    and new.requested_by_user_id is not null
    and new.requested_by_email is not distinct from old.requested_by_email
    and new.approved_by_user_id is not distinct from old.approved_by_user_id
    and new.approved_at is not distinct from old.approved_at
    and new.rejection_reason is not distinct from old.rejection_reason
    and new.suspended_reason is not distinct from old.suspended_reason;

  if signup_requester_link then
    return new;
  end if;

  if new.status is distinct from old.status
    or new.requested_by_user_id is distinct from old.requested_by_user_id
    or new.requested_by_email is distinct from old.requested_by_email
    or new.approved_by_user_id is distinct from old.approved_by_user_id
    or new.approved_at is distinct from old.approved_at
    or new.rejection_reason is distinct from old.rejection_reason
    or new.suspended_reason is distinct from old.suspended_reason
  then
    raise exception 'Only the platform owner can change community approval status';
  end if;

  return new;
end;
$$;

drop trigger if exists community_settings_protect_status_fields on public.community_settings;
create trigger community_settings_protect_status_fields
before update on public.community_settings
for each row execute function public.protect_community_settings_update();
