begin;

create or replace function public.stackscroll_user_id()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif((select auth.jwt() ->> 'stackscroll_user_id'), ''),
    (select auth.uid())::text
  );
$$;

commit;
