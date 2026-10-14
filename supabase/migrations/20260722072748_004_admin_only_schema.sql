/*
# FarmConnect Admin-Only Schema Migration

## Overview
Transforms FarmConnect from a multi-role marketplace to an admin-only model:
- Customers browse and order WITHOUT login (guest checkout)
- Only the admin manages products, categories, and orders
- Cart is handled client-side (localStorage), not in the database
- Orders support guest checkout (user_id nullable, customer info stored directly)

## Changes

### New Columns
**products:** discount_price, is_organic, harvest_date, expiry_date, farmer_name, farmer_location, is_featured, status
**categories:** image_url, status
**orders:** user_id made nullable
**products:** farmer_id made nullable

### RLS Policy Changes
- products: public read (active), admin-only write
- categories: public read, admin-only write
- orders: public insert (guest), admin read/update all
- order_items: public insert (guest), admin read all
- cart: policies dropped (using localStorage)

### Seed Data
- 6 categories with proper slugs and images
- ~25 sample products across all categories with images
*/

-- ============ ADD COLUMNS TO products ============
DO $$ BEGIN
  ALTER TABLE products ADD COLUMN discount_price numeric(10,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN is_organic boolean NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN harvest_date date;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN expiry_date date;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN farmer_name text NOT NULL DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN farmer_location text NOT NULL DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============ ADD COLUMNS TO categories ============
DO $$ BEGIN
  ALTER TABLE categories ADD COLUMN image_url text NOT NULL DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE categories ADD COLUMN status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============ MAKE COLUMNS NULLABLE ============
ALTER TABLE products ALTER COLUMN farmer_id DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- ============ UPDATE RLS POLICIES ============

-- PRODUCTS: public read active, admin sees all, admin-only write
DROP POLICY IF EXISTS "products_select_all" ON products;
DROP POLICY IF EXISTS "products_select_farmer_own" ON products;
DROP POLICY IF EXISTS "products_insert_farmer" ON products;
DROP POLICY IF EXISTS "products_update_farmer_or_admin" ON products;
DROP POLICY IF EXISTS "products_delete_farmer_or_admin" ON products;

CREATE POLICY "products_select_public"
ON products FOR SELECT TO anon, authenticated
USING (status = 'active' OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "products_insert_admin"
ON products FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "products_update_admin"
ON products FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "products_delete_admin"
ON products FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- CATEGORIES: public read, admin-only write
DROP POLICY IF EXISTS "categories_select_all" ON categories;
DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
DROP POLICY IF EXISTS "categories_update_admin" ON categories;
DROP POLICY IF EXISTS "categories_delete_admin" ON categories;

CREATE POLICY "categories_select_public"
ON categories FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "categories_insert_admin"
ON categories FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "categories_update_admin"
ON categories FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "categories_delete_admin"
ON categories FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ORDERS: public insert (guest), admin read/update/delete all
DROP POLICY IF EXISTS "orders_select_own_or_farmer_or_admin" ON orders;
DROP POLICY IF EXISTS "orders_insert_own" ON orders;
DROP POLICY IF EXISTS "orders_update_farmer_or_admin" ON orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON orders;

CREATE POLICY "orders_select_admin"
ON orders FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "orders_insert_public"
ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "orders_update_admin"
ON orders FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "orders_delete_admin"
ON orders FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ORDER_ITEMS: public insert (guest), admin read all
DROP POLICY IF EXISTS "order_items_select_own_or_farmer_or_admin" ON order_items;
DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;

CREATE POLICY "order_items_select_admin"
ON order_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "order_items_insert_public"
ON order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

-- CART: drop policies (using localStorage now)
DROP POLICY IF EXISTS "cart_select_own" ON cart;
DROP POLICY IF EXISTS "cart_insert_own" ON cart;
DROP POLICY IF EXISTS "cart_update_own" ON cart;
DROP POLICY IF EXISTS "cart_delete_own" ON cart;

-- ============ UPDATE TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ SEED CATEGORIES ============
INSERT INTO categories (name, slug, icon, description, image_url, status) VALUES
  ('Fruits', 'fruits', 'apple-whole', 'Fresh fruits from local farms', 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=400', 'active'),
  ('Vegetables', 'vegetables', 'carrot', 'Farm-fresh vegetables', 'https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=compress&cs=tinysrgb&w=400', 'active'),
  ('Grains', 'grains', 'wheat-awn', 'Whole grains and cereals', 'https://images.pexels.com/photos/7421234/pexels-photo-7421234.jpeg?auto=compress&cs=tinysrgb&w=400', 'active'),
  ('Pulses', 'pulses', 'bowl-rice', 'Protein-rich pulses and legumes', 'https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=400', 'active'),
  ('Herbs', 'herbs', 'leaf', 'Aromatic herbs and spices', 'https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&cs=tinysrgb&w=400', 'active'),
  ('Seasonal Products', 'seasonal', 'calendar-week', 'Limited-time seasonal specialties', 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&cs=tinysrgb&w=400', 'active')
ON CONFLICT (slug) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  status = EXCLUDED.status,
  description = EXCLUDED.description;

-- ============ NO SEED PRODUCTS ============
-- No products are seeded. The database starts empty.
-- The admin adds products through the admin panel.
