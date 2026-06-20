-- RPC functions for course search

CREATE OR REPLACE FUNCTION public.search_courses_by_name(search_term TEXT)
RETURNS TABLE (
  id UUID,
  osm_id BIGINT,
  name TEXT,
  city TEXT,
  province TEXT,
  num_holes INTEGER,
  source TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.osm_id,
    c.name,
    c.city,
    c.province,
    c.num_holes,
    c.source,
    ST_Y(c.location::geometry) AS lat,
    ST_X(c.location::geometry) AS lng
  FROM courses c
  WHERE c.name ILIKE '%' || search_term || '%'
  ORDER BY c.name
  LIMIT 50;
$$;

CREATE OR REPLACE FUNCTION public.nearby_courses(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  max_distance_meters DOUBLE PRECISION DEFAULT 50000
)
RETURNS TABLE (
  id UUID,
  osm_id BIGINT,
  name TEXT,
  city TEXT,
  province TEXT,
  num_holes INTEGER,
  source TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.osm_id,
    c.name,
    c.city,
    c.province,
    c.num_holes,
    c.source,
    ST_Y(c.location::geometry) AS lat,
    ST_X(c.location::geometry) AS lng,
    ST_Distance(c.location, ST_MakePoint(user_lng, user_lat)::geography) AS distance_meters
  FROM courses c
  WHERE ST_DWithin(c.location, ST_MakePoint(user_lng, user_lat)::geography, max_distance_meters)
  ORDER BY distance_meters
  LIMIT 50;
$$;
