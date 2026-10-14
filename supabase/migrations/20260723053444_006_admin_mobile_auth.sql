/*
# Admin Mobile-Based Authentication

## Overview
Replaces Supabase email auth with a custom mobile-based admin login system.
- Admins log in with mobile number + password (no email)
- Passwords are stored as bcrypt hashes (verified server-side in edge function)
- Session tokens are issued and stored in admin_sessions table
- All admin pages are protected by session token verification

## New Tables
### admins
- `id` (uuid, primary key)
- `name` (text) - Admin display name
- `mobile` (text, unique) - Mobile number for login
- `password` (text) - bcrypt password hash
- `created_at` (timestamp)

### admin_sessions
- `id` (uuid, primary key)
- `admin_id` (uuid, FK to admins)
- `token` (text, unique) - Session token
- `expires_at` (timestamp) - Token expiry
- `created_at` (timestamp)

## Seed Data
- Default admin: mobile 9876543210, password hash for "nandhish001"
- bcrypt hash: $2b$10$ChhCvMseSbCNcksrFRZrVumLTIzhvAgHwp.jse.7gNnIWFNzMMZZC

## Security
- RLS enabled on both tables
- admins: no public access (edge function uses service role)
- admin_sessions: no public access (edge function uses service role)
*/

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Admin',
  mobile text NOT NULL UNIQUE,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- No policies: edge function uses service role key, bypasses RLS.
-- Frontend never queries these tables directly.

-- Seed default admin account
INSERT INTO admins (name, mobile, password)
VALUES ('Admin', '9876543210', '$2b$10$ChhCvMseSbCNcksrFRZrVumLTIzhvAgHwp.jse.7gNnIWFNzMMZZC')
ON CONFLICT (mobile) DO NOTHING;
