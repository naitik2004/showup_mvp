BEGIN;
-- Normalize supported coarse-city aliases without publishing arbitrary addresses.
CREATE OR REPLACE FUNCTION public.public_player_fields(target uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object(
  'player_id',p.player_id,'name',p.name,'avatar_url',p.avatar_url,
  'city',CASE regexp_replace(lower(p.city),'[^a-z]','','g')
    WHEN 'delhincr' THEN 'Delhi NCR' WHEN 'delhi' THEN 'Delhi NCR'
    WHEN 'mumbai' THEN 'Mumbai' WHEN 'bengaluru' THEN 'Bengaluru'
    WHEN 'bangalore' THEN 'Bengaluru' WHEN 'pune' THEN 'Pune'
    WHEN 'hyderabad' THEN 'Hyderabad' WHEN 'chennai' THEN 'Chennai'
    ELSE NULL END,
  'skill',coalesce(to_jsonb(p)->>'skill_level',to_jsonb(p)->>'skill'),
  'preferred_sports',p.preferred_sports,'stats',public.player_stats_for(p.id)
 ) FROM public.profiles p WHERE p.id=target
$$;
REVOKE ALL ON FUNCTION public.public_player_fields(uuid) FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
