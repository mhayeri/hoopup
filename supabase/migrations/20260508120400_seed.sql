-- Seed a handful of well-known basketball courts for local dev
--
-- These rows have NULL osm_id so they don't collide with Overpass-sourced
-- rows when the map feature starts upserting real OSM data. Lat/lng are
-- approximate but realistic.

insert into public.courts (name, lat, lng, surface, hoops, lit) values
  ('Mission Bay Park — Crown Point', 32.7900, -117.2530, 'asphalt', 4, true),
  ('Balboa Park Recreation Center',  32.7341, -117.1469, 'asphalt', 4, true),
  ('Robb Field',                     32.7649, -117.2519, 'asphalt', 6, true),
  ('Memorial Park',                  32.6875, -117.1142, 'asphalt', 2, false),
  ('La Jolla Shores',                32.8580, -117.2570, 'asphalt', 2, true),
  ('Venice Beach Courts',            33.9850, -118.4720, 'asphalt', 8, true),
  ('Rucker Park',                    40.8298, -73.9358, 'asphalt', 2, true),
  ('West 4th Street Courts',         40.7314, -74.0006, 'asphalt', 2, true)
on conflict do nothing;
