-- Update RLS policies for products, categories, orders, order_items, settings, contact
-- to allow anon+authenticated CRUD (admin auth is handled by custom session-based system,
-- not Supabase auth.users, so auth.uid() is null for admin operations)

-- Products: drop old admin-only policies, allow anon+authenticated
DROP POLICY IF EXISTS products_select_public ON products;
DROP POLICY IF EXISTS products_insert_admin ON products;
DROP POLICY IF EXISTS products_update_admin ON products;
DROP POLICY IF EXISTS products_delete_admin ON products;

CREATE POLICY products_select ON products FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY products_insert ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY products_update ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY products_delete ON products FOR DELETE
  TO anon, authenticated USING (true);

-- Categories: same treatment
DROP POLICY IF EXISTS categories_select ON categories;
DROP POLICY IF EXISTS categories_insert ON categories;
DROP POLICY IF EXISTS categories_update ON categories;
DROP POLICY IF EXISTS categories_delete ON categories;

CREATE POLICY categories_select ON categories FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY categories_insert ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY categories_update ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY categories_delete ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- Orders
DROP POLICY IF EXISTS orders_select ON orders;
DROP POLICY IF EXISTS orders_insert ON orders;
DROP POLICY IF EXISTS orders_update ON orders;
DROP POLICY IF EXISTS orders_delete ON orders;

CREATE POLICY orders_select ON orders FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY orders_insert ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY orders_update ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY orders_delete ON orders FOR DELETE
  TO anon, authenticated USING (true);

-- Order items
DROP POLICY IF EXISTS order_items_select ON order_items;
DROP POLICY IF EXISTS order_items_insert ON order_items;
DROP POLICY IF EXISTS order_items_update ON order_items;
DROP POLICY IF EXISTS order_items_delete ON order_items;

CREATE POLICY order_items_select ON order_items FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY order_items_insert ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY order_items_update ON order_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY order_items_delete ON order_items FOR DELETE
  TO anon, authenticated USING (true);

-- Settings
DROP POLICY IF EXISTS settings_select ON settings;
DROP POLICY IF EXISTS settings_insert ON settings;
DROP POLICY IF EXISTS settings_update ON settings;
DROP POLICY IF EXISTS settings_delete ON settings;

CREATE POLICY settings_select ON settings FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY settings_insert ON settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY settings_update ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY settings_delete ON settings FOR DELETE
  TO anon, authenticated USING (true);

-- Contact
DROP POLICY IF EXISTS contact_select ON contact;
DROP POLICY IF EXISTS contact_insert ON contact;
DROP POLICY IF EXISTS contact_update ON contact;
DROP POLICY IF EXISTS contact_delete ON contact;

CREATE POLICY contact_select ON contact FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY contact_insert ON contact FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY contact_update ON contact FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY contact_delete ON contact FOR DELETE
  TO anon, authenticated USING (true);

-- Seed default product: Banana
INSERT INTO products (name, description, price, unit, stock, image_url, category_id, is_organic, is_featured, status, farmer_name, farmer_location)
SELECT 'Banana', 'Fresh organic bananas rich in potassium and energy. Perfect for a healthy snack or smoothies.', 40, 'kg', 100, 'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=600', '57ad8a26-9202-46b1-803e-de0d2e0f83da', true, true, 'active', 'Green Valley Farm', 'Green Valley'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Banana');
