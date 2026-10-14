/*
# Admin Auth: add email + avatar_url, seed default admin

1. Modified Tables
- `admins`: add `email` (text, unique, not null) and `avatar_url` (text, nullable).
  The `mobile` column is kept for backward compatibility; new admin logins use email + password.
2. Data
- Seed a default admin account if it does not already exist:
  Email: admin@farmconnect.com  Password: admin123
3. Security
- No RLS policy changes. The `admins` table remains accessible only via the service-role
  edge function; no new anon/authenticated policies are added.
4. Notes
- Idempotent: uses IF NOT EXISTS guards and an INSERT ... ON CONFLICT DO NOTHING seed.
*/

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Backfill email for any existing rows that have none, using mobile as a placeholder.
UPDATE admins SET email = mobile || '@local' WHERE email IS NULL;

ALTER TABLE admins ALTER COLUMN email SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admins_email_key'
  ) THEN
    ALTER TABLE admins ADD CONSTRAINT admins_email_key UNIQUE (email);
  END IF;
END $$;

-- Seed default admin (idempotent).
INSERT INTO admins (name, email, password, mobile)
VALUES ('Admin', 'admin@farmconnect.com', 'admin123', '0000000000')
ON CONFLICT (email) DO NOTHING;
