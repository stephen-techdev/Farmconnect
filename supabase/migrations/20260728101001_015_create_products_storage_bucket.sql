/*
# Create products storage bucket for product image uploads

1. Storage
- Create a public bucket named `products` for storing product images uploaded by admins.
2. Security
- The bucket is public so uploaded images can be displayed via public URLs.
- Access is managed through the frontend using the anon key with the admin session.
3. Notes
- Idempotent: uses IF NOT EXISTS check.
*/

INSERT INTO storage.buckets (id, name, public)
SELECT 'products', 'products', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'products');

-- Allow anyone to read product images (public bucket)
DROP POLICY IF EXISTS "Public read access for products bucket" ON storage.objects;
CREATE POLICY "Public read access for products bucket"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'products');

-- Allow anyone to upload product images (admin manages via anon key + session)
DROP POLICY IF EXISTS "Public upload access for products bucket" ON storage.objects;
CREATE POLICY "Public upload access for products bucket"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'products');

-- Allow updates to product images
DROP POLICY IF EXISTS "Public update access for products bucket" ON storage.objects;
CREATE POLICY "Public update access for products bucket"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'products') WITH CHECK (bucket_id = 'products');

-- Allow deletion of product images
DROP POLICY IF EXISTS "Public delete access for products bucket" ON storage.objects;
CREATE POLICY "Public delete access for products bucket"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'products');
