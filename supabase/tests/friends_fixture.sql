-- ISOLATED TEST DATABASE ONLY. This is not a production migration.
CREATE TABLE public.games(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), status text, starts_at timestamptz);
CREATE TABLE public.game_members(game_id uuid REFERENCES games(id), user_id uuid REFERENCES profiles(id), PRIMARY KEY(game_id,user_id));
CREATE TABLE public.friendships(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_a uuid NOT NULL REFERENCES profiles(id), user_b uuid NOT NULL REFERENCES profiles(id), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined')), created_at timestamptz DEFAULT now());
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
GRANT UPDATE ON profiles TO authenticated;
CREATE POLICY profiles_update_test ON profiles FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
