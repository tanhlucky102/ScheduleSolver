-- Additive aggregate schema upgrade. Run after 001; no inferred room data.
begin;
update schedule_web.workspaces
set body = jsonb_set(jsonb_set(body, '{rooms}', coalesce(body->'rooms','[]'::jsonb)),
                     '{reservations}', coalesce(body->'reservations','[]'::jsonb)),
    revision = revision + 1
where not (body ? 'rooms' and body ? 'reservations');

create or replace function schedule_web.validate_room_data() returns trigger
language plpgsql set search_path = pg_catalog, schedule_web as $$
declare field text; room jsonb;
begin
  foreach field in array array['rooms','reservations'] loop
    if jsonb_typeof(new.body->field) is distinct from 'array' then
      raise exception 'Workspace % must be an array', field;
    end if;
    if exists(select 1 from jsonb_array_elements(new.body->field) e
              group by e->>'id' having count(*)>1)
      or exists(select 1 from jsonb_array_elements(new.body->field) e
                where coalesce(trim(e->>'id'),'')='') then
      raise exception 'Duplicate or empty identity in %', field;
    end if;
  end loop;
  for room in select value from jsonb_array_elements(new.body->'rooms') loop
    if jsonb_typeof(room->'capacity') is distinct from 'number'
       or (room->>'capacity')::numeric < 1 or (room->>'capacity')::numeric > 10000
       or (room->>'capacity')::numeric <> trunc((room->>'capacity')::numeric)
       or coalesce(trim(room->>'room_type'),'')=''
       or jsonb_typeof(room->'equipment') is distinct from 'array'
       or jsonb_typeof(room->'availability') is distinct from 'array' then
      raise exception 'Invalid room specification';
    end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(new.body->'reservations') b
      where not exists(select 1 from jsonb_array_elements(new.body->'rooms') r
                       where r->>'id'=b->>'room_id')) then
    raise exception 'Unknown reserved room';
  end if;
  if exists(select 1 from jsonb_array_elements(new.body->'published') p
      where p->>'room_id' is not null and not exists(
        select 1 from jsonb_array_elements(new.body->'rooms') r where r->>'id'=p->>'room_id')) then
    raise exception 'Cannot remove a published room';
  end if;
  return new;
end $$;
drop trigger if exists validate_room_data on schedule_web.workspaces;
create trigger validate_room_data before insert or update of body on schedule_web.workspaces
for each row execute function schedule_web.validate_room_data();
revoke all on function schedule_web.validate_room_data() from public;
commit;
