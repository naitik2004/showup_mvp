-- Minimal legacy schema for isolated PostgreSQL migration/RLS tests only.
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF; IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; END $$;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth TO authenticated,anon;
CREATE TABLE profiles(id uuid PRIMARY KEY,name text,avatar_url text);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read ON profiles FOR SELECT TO authenticated USING(true);
GRANT SELECT ON profiles TO authenticated;
CREATE TABLE game_groups(is_permanent boolean NOT NULL DEFAULT false,id uuid PRIMARY KEY,host_id uuid,sport text,location_name text,scheduled_at timestamptz,max_players int,skill_level text,status text,created_at timestamptz);
CREATE TABLE group_members(group_id uuid,user_id uuid,status text,joined_at timestamptz);
CREATE TABLE messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),group_id uuid REFERENCES game_groups(id),sender_id uuid REFERENCES profiles(id),content text,created_at timestamptz DEFAULT now(),expires_at timestamptz);
CREATE TABLE game_invites(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),game_id uuid REFERENCES game_groups(id),from_user uuid,to_user uuid,status text DEFAULT 'pending',created_at timestamptz DEFAULT now(),responded_at timestamptz);
CREATE UNIQUE INDEX ON game_invites(game_id,to_user) WHERE status='pending';
CREATE TABLE game_share_links(game_id uuid PRIMARY KEY REFERENCES game_groups(id),token uuid UNIQUE,created_by uuid,created_at timestamptz,revoked_at timestamptz);
CREATE TABLE user_blocks(blocker_id uuid,blocked_id uuid);
CREATE PUBLICATION supabase_realtime;
