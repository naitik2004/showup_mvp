-- Isolated test database only; supplements bootstrap.sql, never production.
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}');
ALTER TABLE profiles ADD COLUMN handle text;
ALTER TABLE profiles ADD COLUMN city text DEFAULT 'Delhi NCR';
ALTER TABLE profiles ADD COLUMN preferred_sports text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN created_at timestamptz DEFAULT now();
ALTER TABLE profiles ADD COLUMN onboarded boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN email text; -- Deliberate private-column canary.
ALTER TABLE profiles ADD FOREIGN KEY(id) REFERENCES auth.users(id);
CREATE TABLE friendships(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_a uuid REFERENCES profiles(id),user_b uuid REFERENCES profiles(id),status text DEFAULT 'pending',created_at timestamptz DEFAULT now());
CREATE POLICY profiles_update ON profiles FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
CREATE TABLE sport_ratings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),game_id uuid REFERENCES games(id),ratee_id uuid REFERENCES profiles(id),rater_id uuid REFERENCES profiles(id),sport text,skill_score int,sportsmanship_score int,reliability_score int,created_at timestamptz DEFAULT now());
