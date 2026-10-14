/*
# Create app_users table for customer authentication

1. New Tables
- `app_users`
  - `id` (uuid, primary key)
  - `name` (text, not null) — full name
  - `email` (text, unique, not null) — login email
  - `password` (text, not null) — plaintext password (edge-function validated)
  - `phone` (text, nullable) — optional phone number
  - `avatar_url` (text, nullable) — optional profile picture URL
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `app_users`.
- No anon/authenticated policies: the table is accessed ONLY through the
  service-role edge function (user-auth). Direct anon-key access is denied
  by default once RLS is enabled with no permissive policies.
3. Notes
- This table is separate from the `admins` table. User login never touches
  `admins`; admin login never touches `app_users`.
- Idempotent: uses IF NOT EXISTS guards.
*/

CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_users_email_key'
  ) THEN
    ALTER TABLE app_users ADD CONSTRAINT app_users_email_key UNIQUE (email);
  END IF;
END $$;
