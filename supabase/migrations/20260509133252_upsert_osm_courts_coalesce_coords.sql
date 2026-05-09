-- Patch upsert_osm_courts: coalesce lat/lng on conflict.
--
-- The original upsert overwrote lat/lng unconditionally, letting any caller
-- shift a court's pin by submitting fabricated coordinates for a known
-- osm_id. Apply the same coalesce(excluded.X, public.courts.X) pattern used
-- for name/surface/hoops/lit so a NULL or missing coord in a crafted payload
-- can't blank out an existing row.
--
-- Overpass always supplies coords for elements it returns, so this only
-- changes behavior for adversarial input.

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
    name           = coalesce(excluded.name,    public.courts.name),
    lat            = coalesce(excluded.lat,     public.courts.lat),
    lng            = coalesce(excluded.lng,     public.courts.lng),
    surface        = coalesce(excluded.surface, public.courts.surface),
    hoops          = coalesce(excluded.hoops,   public.courts.hoops),
    lit            = coalesce(excluded.lit,     public.courts.lit),
    last_synced_at = now();
end $$;
