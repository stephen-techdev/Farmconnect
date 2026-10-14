/*
# Drop unique constraint on admins.mobile

1. Modified Tables
- `admins`: drop the `admins_mobile_key` unique constraint.
  Admin authentication is now based on email + password; the mobile column is retained
  for backward compatibility but no longer needs to be unique.
2. Security
- No RLS or policy changes.
3. Notes
- Idempotent: uses IF EXISTS.
*/

ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_mobile_key;
