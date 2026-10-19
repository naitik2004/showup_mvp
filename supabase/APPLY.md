# Apply and verify database changes

Never replay all SQL against a populated project. The repository includes partial
legacy history; match the deployed schema and migration history first. Never run
`tests/` fixtures, `drop_unused_tables.sql`, or seed scripts on a hosted project.

## 1. Inspect before changing anything

In the authenticated ShowUp project's SQL editor, run:

```sql
select table_name from information_schema.tables where table_schema = 'public';
select * from supabase_migrations.schema_migrations order by version;
select to_regclass('public.profiles'), to_regclass('public.games'),
       to_regclass('public.game_members'), to_regclass('public.group_members'),
       to_regclass('public.player_id_aliases');
select column_name, data_type, is_nullable from information_schema.columns
where table_schema='public' and table_name='profiles' order by ordinal_position;
select tgname, pg_get_triggerdef(oid) from pg_trigger
where tgrelid in ('auth.users'::regclass, 'public.profiles'::regclass) and not tgisinternal;
```

If the migration history table is absent, record that error and inspect schema
objects individually. Do not guess that no migrations ran. Record counts of key
existing tables, the current triggers, policies and constraints without copying
private rows into chat or source files. Check for profiles without auth owners:

```sql
select count(*) as profiles_without_auth_owner from public.profiles p
left join auth.users u on u.id=p.id where u.id is null;
```

An orphan requires a verified legacy identity mapping. Migration 019 deliberately
stops rather than inventing an owner or deleting data.

## 2. Back up existing data

Use Database → Backups and verify a recoverable backup before executing SQL.
If unavailable, export the key tables securely: profiles, games/game_groups,
game_members/group_members, messages, friendships, game_invites, sport_ratings,
user_blocks, player_id_aliases, game_share_links and firebase_user_links if present.
Include schema, policies and functions in the backup; CSV alone cannot restore
schema/RLS. Keep exports out of Git and chat. Record row counts and foreign-key
orphan checks before and after migration.

## 3. Apply only missing migrations, one at a time

Open a new SQL editor query, paste one complete migration, click Run, and wait for
Success. On any error, stop: save its exact message and do not run later files.
Do not run the next file after a failed transaction.

The current feature chain is 011 → 012 → 013 → 014 → 015 → 016 → 017 → 018 → 019 → 020.
Earlier files require the legacy application schema; 002 alone is not a complete
bootstrap. Resolve any missing historical schema before continuing. If the
project already has 018 successfully applied, apply **019, then 020**, waiting
for Success after each:

`migrations/019_player_identity_contract.sql`

`migrations/020_public_city_aliases.sql`

019 repairs codes containing L, keeps valid IDs, preserves former codes in
aliases/legacy_id, and leaves UUID relationships intact. It restricts direct
profile reads and old UUID action entry points; deploy the matching client changes
together. Do not deploy only half of this client/database contract.

The existing auth-user INSERT trigger creates the profile in the same transaction;
its profiles BEFORE INSERT trigger allocates the public code. Verify both exist.

## 4. Realtime and authentication

In Database → Replication/Publications, inspect `supabase_realtime`. The current
React implementation subscribes to **messages, games, game_members and
player_visibility_events**. Migration 015 adds the first three; 019 adds viewer-owned visibility events for block
cache invalidation. `group_members` belongs to the retained legacy schema; enable
it only for a still-active legacy consumer. Enabling the wrong table does not
update the current lobby.

Inspect Authentication → Providers. Preserve the configured sign-in method. This
client currently implements email/password; verify email is enabled. Google needs
its own provider configuration and client flow; do not enable/change it blindly.

## 5. Verification queries

```sql
-- Every result should be zero.
select count(*) as invalid_ids from public.profiles
where player_id is null or player_id !~ '^SU-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$';
select count(*) as duplicate_ids from (
  select player_id from public.profiles group by player_id having count(*)>1
) duplicates;
select count(*) as orphan_members from public.game_members m
left join public.profiles p on p.id=m.user_id where p.id is null;
select count(*) as orphan_messages from public.messages m
left join public.profiles p on p.id=m.sender_id where p.id is null;
select count(*) as orphan_friendships from public.friendships f
left join public.profiles a on a.id=f.user_a
left join public.profiles b on b.id=f.user_b where a.id is null or b.id is null;

select relname, relrowsecurity from pg_class where relnamespace='public'::regnamespace
and relname in ('profiles','friendships','games','game_members','messages',
'game_invites','user_blocks','player_id_aliases','player_lookup_limits','player_visibility_events');
select tablename,policyname,cmd,roles,qual,with_check from pg_policies
where schemaname='public' order by tablename,policyname;
select conname,pg_get_constraintdef(oid) from pg_constraint
where conrelid='public.profiles'::regclass;
select tablename from pg_publication_tables where pubname='supabase_realtime';
select routine_name,grantee,privilege_type from information_schema.routine_privileges
where routine_schema='public' and routine_name in
('find_player','friends_players','friends_players_internal','friend_action',
'friend_action_by_code','send_game_invite','invite_player_by_code',
'generate_short_player_id','public_player_fields');
select grantee,column_name,privilege_type from information_schema.column_privileges
where table_schema='public' and table_name='profiles'
and grantee in ('anon','authenticated') order by grantee,column_name;
```

Check that public/profile helpers and old UUID action functions are not executable
by anon/authenticated. Only `find_player` and public review reads allow anon.
Profile reads allow only listed columns and the owner's row. Public city values
are limited to the six supported coarse cities; other free-form values stay private. Verify two real test
accounts can sign in, copy IDs, find each other regardless of case, send requests,
invite by code, view the lobby/chat IDs and share `/#/p/<player_id>`.

Lookup limits are 60/minute per signed-in actor, with one shared global anonymous
bucket (including unknown codes). Anonymous callers cannot evade the quota by
spoofing an IP header; the tradeoff is a shared anonymous availability limit.

## Configuration

This is a Next.js app: keep only the public project URL and anon/publishable key
in git-ignored `.env.local`, using the `NEXT_PUBLIC_SUPABASE_*` names from
`.env.example`. There is no `js/config.js` in the active implementation. Never add
a service-role key, database password or dashboard credential to browser code,
Git, logs or chat.

## Local acceptance rehearsal

Use a NEW isolated PostgreSQL database, never a hosted project:

```sh
PGHOST=/private/tmp PGPORT=55441 PGDATABASE=showup_identity_test python3 supabase/tests/test_player_identity.py
```

The runner first inventories tables and refuses a populated database. It applies
fixtures/migrations in order and stops on the first error. This tests database
behavior without changing hosted accounts or data.


## Hosted application record — 19 October 2026

Target matched the workspace public project URL. Preflight found migration 018's
schema/functions, 7 profiles with valid auth owners and 2 codes needing the new
alphabet repair. The project has no scheduled backups on its current Free plan.

A private CSV export was downloaded to `~/Downloads/Supabase Snippet Untitled query.csv`
before any schema writes. It contains one JSON backup bundle: all 13 application
and legacy tables, plus columns, constraints, policies, triggers, functions, views,
table/column grants and publication metadata. The file was parsed successfully;
SHA-256: `6863a3df281bdfc06dfc5a511e3592c9bddfb8b557a9f1662887bcce12ba3c6e`.
This is an application-data/schema export, not a managed full-cluster/auth backup.
Do not commit it, its extracted contents, or share-link tokens to Git.

Migrations 019 and 020 each returned Success. All 7 profile IDs meet the corrected
format and uniqueness requirements; old values are preserved. All 10 relevant
tables have RLS enabled; private helper/old UUID actions are denied to clients.
Before/after fingerprints match for names/cities/UUIDs, match membership and
friendship/invitation relationships, legacy relationships, share links and message
content. Counts remain 6 matches, 9 memberships, 14 messages, 4 friendships and
6 invitations. No profiles lack an auth owner.

Hosted rollback-only verification passed. Temporary name/block changes were
rolled back. Browser verification used the existing signed-in account without
sending real friend requests, invites or chat messages. Copy/share, lowercase
lookup, name search, self/unknown error toasts, lobby/chat ID disclosure and invite
controls passed. Public stats matched the owner's 0 played, 2 hosted, 2 joined,
1 upcoming. A 390px mobile check had no horizontal overflow.

Email auth was already enabled; no provider settings were changed. Required
Realtime tables were verified. Frontend changes have not been pushed or deployed;
the deployed website needs the matching client release for the new RPC/grant
contract. The updated local app remains running at localhost:3000.
