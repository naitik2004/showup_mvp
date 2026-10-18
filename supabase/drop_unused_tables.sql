-- REVIEW ONLY: do not run until you have backed up the Supabase project.
-- These tables hold feature data that the app no longer uses. Dropping them
-- permanently deletes their rows. CASCADE can also remove dependent views,
-- constraints, policies, and functions.
-- The profiles table and Supabase's auth schema are intentionally excluded.

BEGIN;

DROP TABLE IF EXISTS public.game_invites CASCADE;
DROP TABLE IF EXISTS public.friendships CASCADE;
DROP TABLE IF EXISTS public.sport_ratings CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.game_groups CASCADE;
DROP TABLE IF EXISTS public.firebase_user_links CASCADE;
DROP TABLE IF EXISTS public.user_blocks CASCADE;
-- public.users was the legacy profile table. Migration 011 may have renamed
-- it to profiles; this statement only drops it if it still exists separately.
DROP TABLE IF EXISTS public.users CASCADE;

COMMIT;
