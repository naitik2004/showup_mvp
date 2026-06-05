-- PostGIS function to find nearby game groups
CREATE OR REPLACE FUNCTION find_groups_near(
  lat FLOAT,
  lng FLOAT,
  radius_meters FLOAT DEFAULT 5000
)
RETURNS TABLE (
  id UUID,
  host_id UUID,
  sport TEXT,
  location GEOGRAPHY,
  location_name TEXT,
  max_players INTEGER,
  skill_level TEXT,
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_permanent BOOLEAN,
  status TEXT,
  created_at TIMESTAMPTZ,
  host_name TEXT,
  member_count BIGINT,
  distance FLOAT
) AS $$
  SELECT
    g.id,
    g.host_id,
    g.sport,
    g.location,
    g.location_name,
    g.max_players,
    g.skill_level,
    g.scheduled_at,
    g.expires_at,
    g.is_permanent,
    g.status,
    g.created_at,
    u.name AS host_name,
    (SELECT COUNT(*) FROM public.group_members gm WHERE gm.group_id = g.id AND gm.status = 'accepted') AS member_count,
    ST_Distance(
      g.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS distance
  FROM public.game_groups g
  LEFT JOIN public.users u ON g.host_id = u.id
  WHERE g.status = 'open'
    AND g.scheduled_at > NOW()
    AND ST_DWithin(
      g.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance ASC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
