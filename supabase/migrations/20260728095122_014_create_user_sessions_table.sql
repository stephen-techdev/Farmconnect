/*
# Create user_sessions table for customer session management

1. New Tables
- `user_sessions`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to app_users, on delete cascade)
  - `token` (text, not null) — session token
  - `expires_at` (timestamptz, not null) — session expiry
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `user_sessions`. No permissive policies: accessed only via
  the service-role edge function (user-auth).
3. Notes
- Separate from `admin_sessions`. User sessions never interact with admin data.
- Idempotent: uses IF NOT EXISTS guards.
*/

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
