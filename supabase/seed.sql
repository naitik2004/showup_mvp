-- LOCAL DEVELOPMENT ONLY. Requires a locally created Supabase Auth profile.
-- Run via local `supabase db reset`; never execute against a hosted project.
DO $$
DECLARE host uuid; BEGIN
 SELECT id INTO host FROM public.profiles ORDER BY created_at LIMIT 1;
 IF host IS NULL THEN RAISE NOTICE 'Create a local account/profile, then rerun seed.sql.'; RETURN; END IF;
 PERFORM set_config('request.jwt.claim.sub',host::text,true);
 PERFORM public.create_game('football','Sector 14 Park',now()+interval '1 day',10,'beginner','Bring water.');
 PERFORM public.create_game('badminton','Community sports hall',now()+interval '2 days',4,'intermediate','Bring your racket.');
 PERFORM public.create_game('basketball','Central court',now()+interval '3 days',8,'pro','Meet at the north entrance.');
END $$;
