/*
# Payment methods: Cash on Delivery codes + UPI online payment

1. Modified Tables
- `orders`:
  - `payment_status`  pending | paid | failed | refunded
  - `cod_code`        6-digit code the customer shows at pickup (COD only)
  - `cod_confirmed_at` when the delivery agent/admin confirmed the COD handover
  - `paid_at`         when payment was confirmed (COD handover or manual UPI mark)
  - `upi_ref`         customer-supplied UPI reference / transaction id
  Constraint payment_method now constrained to 'cod' | 'upi'.
- `settings`: seed `upi_id` and `upi_payee_name` used to build the UPI QR.
2. Data
- Seed default (empty) UPI settings so the admin Payments page has rows to edit.
3. Security
- No new policies. `orders` / `payments` already permit anon+authenticated CRUD
  via migration 007; payment confirmation is therefore performed by the admin UI.
4. Notes
- Idempotent: all ALTERs are guarded.
*/

-- ============ ORDERS: PAYMENT COLUMNS ============
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN payment_status text NOT NULL DEFAULT 'pending';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN cod_code text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN cod_confirmed_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN paid_at timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN upi_ref text DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Constrain payment_method to the two supported flows.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cod', 'upi'));

DO $$ BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Index for the admin COD queue.
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_cod_code ON orders(cod_code);

-- ============ PAYMENTS TABLE: UPI REFERENCE ============
DO $$ BEGIN
  ALTER TABLE payments ADD COLUMN upi_ref text DEFAULT '';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE payments ADD COLUMN cod_code text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============ SEED UPI SETTINGS ============
INSERT INTO settings (key, value) VALUES
  ('upi_id', ''),
  ('upi_payee_name', 'FarmConnect')
ON CONFLICT (key) DO NOTHING;