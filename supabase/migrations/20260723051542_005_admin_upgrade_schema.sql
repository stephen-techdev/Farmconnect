/*
# FarmConnect Admin Upgrade Schema

## Overview
Adds columns and tables needed for the full admin management system:
- Product SKU and short description
- Customer email on orders
- Expanded order statuses (confirmed, packed, shipped)
- Payments table for tracking payment status
- Settings table for store configuration

## New Columns
### products
- `sku` (text, unique) - Stock keeping unit identifier
- `short_description` (text) - Brief product description for cards/listings

### orders
- `customer_email` (text) - Customer's email for order communications
- Status constraint expanded to include: pending, confirmed, packed, shipped, delivered, cancelled

## New Tables
### payments
- `id` (uuid, primary key)
- `order_id` (uuid, FK to orders)
- `amount` (numeric) - Payment amount
- `method` (text) - Payment method (cod, card, upi)
- `status` (text) - Payment status (pending, paid, failed, refunded)
- `transaction_id` (text) - Transaction reference
- `created_at` (timestamp)

### settings
- `id` (uuid, primary key)
- `key` (text, unique) - Setting key
- `value` (text) - Setting value
- `updated_at` (timestamp)

## Security
- RLS enabled on payments and settings
- payments: admin read/update, public insert (guest checkout records payment intent)
- settings: public read, admin write
*/

-- ============ ADD COLUMNS TO products ============
DO $$ BEGIN
  ALTER TABLE products ADD COLUMN sku text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN short_description text NOT NULL DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============ ADD COLUMNS TO orders ============
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN customer_email text NOT NULL DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============ EXPAND ORDER STATUS CONSTRAINT ============
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'));

-- ============ PAYMENTS TABLE ============
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'cod',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  transaction_id text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- ============ SETTINGS TABLE ============
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- ============ ENABLE RLS ============
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============ PAYMENTS POLICIES ============
DROP POLICY IF EXISTS "payments_select_admin" ON payments;
CREATE POLICY "payments_select_admin"
ON payments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "payments_insert_public" ON payments;
CREATE POLICY "payments_insert_public"
ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "payments_update_admin" ON payments;
CREATE POLICY "payments_update_admin"
ON payments FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "payments_delete_admin" ON payments;
CREATE POLICY "payments_delete_admin"
ON payments FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============ SETTINGS POLICIES ============
DROP POLICY IF EXISTS "settings_select_public" ON settings;
CREATE POLICY "settings_select_public"
ON settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "settings_insert_admin" ON settings;
CREATE POLICY "settings_insert_admin"
ON settings FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "settings_update_admin" ON settings;
CREATE POLICY "settings_update_admin"
ON settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "settings_delete_admin" ON settings;
CREATE POLICY "settings_delete_admin"
ON settings FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============ SEED DEFAULT SETTINGS ============
INSERT INTO settings (key, value) VALUES
  ('store_name', 'FarmConnect'),
  ('store_email', 'admin@farmconnect.com'),
  ('store_phone', ''),
  ('store_address', ''),
  ('currency', 'USD'),
  ('currency_symbol', '$'),
  ('low_stock_threshold', '10'),
  ('free_delivery_threshold', '50'),
  ('delivery_fee', '5'),
  ('discount_rate', '10')
ON CONFLICT (key) DO NOTHING;
