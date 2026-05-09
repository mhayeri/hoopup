-- upsert_osm_courts(payload jsonb)
--
-- Server-side write path for Overpass-sourced court rows. Clients can't write
-- to public.courts directly (RLS blocks it), so this SECURITY DEFINER function
-- is the sole entry point for OSM data. Keyed on osm_id; seed courts have a
-- NULL osm_id and are unaffected.
--
-- coalesce(excluded.X, public.courts.X) keeps existing values when OSM doesn't
-- supply them, since OSM data is patchy.

create or replace function public.upsert_osm_courts(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if jsonb_typeof(payload) <> 'array' then
    raise exception 'payload must be a jsonb array';
  end if;
  if jsonb_array_length(payload) > 500 then
    raise exception 'payload too large (max 500 entries per call)';
  end if;

  insert into public.courts (osm_id, name, lat, lng, surface, hoops, lit, last_synced_at)
  select
    (elem->>'osm_id')::bigint,
    elem->>'name',
    (elem->>'lat')::double precision,
    (elem->>'lng')::double precision,
    elem->>'surface',
    nullif(elem->>'hoops', '')::int,
    case elem->>'lit' when 'yes' then true when 'no' then false else null end,
    now()
  from jsonb_array_elements(payload) as elem
  where (elem->>'osm_id') is not null
  on conflict (osm_id) do update set
    name           = coalesce(excluded.name, public.courts.name),
    lat            = excluded.lat,
    lng            = excluded.lng,
    surface        = coalesce(excluded.surface, public.courts.surface),
    hoops          = coalesce(excluded.hoops, public.courts.hoops),
    lit            = coalesce(excluded.lit, public.courts.lit),
    last_synced_at = now();
end $$;

revoke all on function public.upsert_osm_courts(jsonb) from public;
grant execute on function public.upsert_osm_courts(jsonb) to anon, authenticated;
