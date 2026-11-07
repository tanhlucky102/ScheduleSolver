-- Run once in Supabase SQL editor as database owner. No changes to existing tables.
begin;
create schema if not exists schedule_web;

-- JSONB aggregate mirrors the legacy workspace boundary. A single row lock makes
-- cross-entity transitions atomic; Python validates every reference on commit.
-- A separate schema is not exposed by the Supabase Data API.
create table schedule_web.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(name)>0),
  revision bigint not null default 0 check(revision>=0),
  body jsonb not null default '{}'::jsonb check(jsonb_typeof(body)='object')
);
create table schedule_web.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid not null references schedule_web.workspaces(id),
  role text not null check(role in ('STAFF','HEAD','TEACHER')),
  department text,
  teacher text,
  active boolean not null default true,
  check ((role='STAFF' and department is null and teacher is null)
      or (role='HEAD' and department is not null and teacher is not null)
      or (role='TEACHER' and teacher is not null)),
  unique(workspace_id,teacher)
);
create unique index one_head_per_department on schedule_web.profiles(workspace_id,department) where role='HEAD';
create table schedule_web.publications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references schedule_web.workspaces(id),
  revision bigint not null,
  actor uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  body jsonb not null check(jsonb_typeof(body)='array'),
  unique(workspace_id,revision)
);
create table schedule_web.audit_log (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references schedule_web.workspaces(id),
  actor uuid not null references auth.users(id),
  action text not null,
  revision bigint not null,
  created_at timestamptz not null default now()
);
alter table schedule_web.workspaces enable row level security;
alter table schedule_web.profiles enable row level security;
alter table schedule_web.publications enable row level security;
alter table schedule_web.audit_log enable row level security;
revoke all on schema schedule_web from public, anon, authenticated;
revoke all on all tables in schema schedule_web from public, anon, authenticated;
-- Browser roles have no direct access, including to profiles. Backend connects
-- with a private DB credential. For least privilege create a dedicated login
-- out-of-band, GRANT USAGE and required SELECT/INSERT/UPDATE and BYPASSRLS.
-- Never put that credential in NEXT_PUBLIC_* or expose this schema through PostgREST.
-- References and duplicate identities within the aggregate are also enforced in SQL.
create function schedule_web.validate_workspace() returns trigger language plpgsql
set search_path = pg_catalog, schedule_web as $$
declare field text;
begin
  foreach field in array array['departments','teachers','offerings','sessions','external'] loop
    if jsonb_typeof(new.body->field) is distinct from 'array' then
      raise exception 'Workspace % must be an array', field;
    end if;
    if exists(select 1 from jsonb_array_elements(new.body->field) e
              group by e->>'id' having count(*)>1)
       or exists(select 1 from jsonb_array_elements(new.body->field) e where coalesce(e->>'id','')='') then
      raise exception 'Duplicate or empty identity in %', field;
    end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(new.body->'teachers') t
      where not exists(select 1 from jsonb_array_elements(new.body->'departments') d
                       where d->>'id'=t->>'department')) then
    raise exception 'Unknown teacher department';
  end if;
  if exists(select 1 from jsonb_array_elements(new.body->'offerings') o
      where not exists(select 1 from jsonb_array_elements(new.body->'departments') d
                       where d->>'id'=o->>'department')) then
    raise exception 'Unknown offering department';
  end if;
  if exists(select 1 from jsonb_array_elements(new.body->'sessions') s
      where not exists(select 1 from jsonb_array_elements(new.body->'offerings') o where o->>'id'=s->>'offering')
         or not exists(select 1 from jsonb_array_elements(new.body->'departments') d where d->>'id'=s->>'department')
         or (s->>'teacher' is not null and not exists(select 1 from jsonb_array_elements(new.body->'teachers') t where t->>'id'=s->>'teacher'))) then
    raise exception 'Broken session reference';
  end if;
  if exists(select 1 from jsonb_array_elements(new.body->'external') e
      where not exists(select 1 from jsonb_array_elements(new.body->'teachers') t where t->>'id'=e->>'teacher')) then
    raise exception 'Unknown external teacher';
  end if;
  return new;
end $$;
create trigger validate_workspace before insert or update of body on schedule_web.workspaces
for each row execute function schedule_web.validate_workspace();
revoke all on function schedule_web.validate_workspace() from public;
commit;
