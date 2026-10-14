/*
# FarmConnect - RLS Policies

Enables RLS on all tables and creates ownership-based policies.

## Security Model
- profiles: owner read/update; public read for non-blocked profiles.
- categories: public read, admin write.
- products: public read (active); farmers CRUD own; admins all.
- cart: owner-scoped CRUD.
- order_items: owner read; farmer read for own products; admin all; owner insert.
- orders: owner read/insert; farmer read for own products; admin all.
- reviews: public read; authenticated insert own; owner update/delete; admin all.
- contact: public insert; admin read.
*/

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact ENABLE ROW LEVEL SECURITY;

-- ============ PROFILES POLICIES ============
DROP POLICY IF EXISTS "profiles_select_own_or_public" ON profiles;
CREATE POLICY "profiles_select_own_or_public"
ON profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR is_blocked = false);

DROP POLICY IF EXISTS "profiles_select_anon_nonblocked" ON profiles;
CREATE POLICY "profiles_select_anon_nonblocked"
ON profiles FOR SELECT TO anon
USING (is_blocked = false);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ CATEGORIES POLICIES ============
DROP POLICY IF EXISTS "categories_select_all" ON categories;
CREATE POLICY "categories_select_all"
ON categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
CREATE POLICY "categories_insert_admin"
ON categories FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "categories_update_admin" ON categories;
CREATE POLICY "categories_update_admin"
ON categories FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "categories_delete_admin" ON categories;
CREATE POLICY "categories_delete_admin"
ON categories FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============ PRODUCTS POLICIES ============
DROP POLICY IF EXISTS "products_select_all" ON products;
CREATE POLICY "products_select_all"
ON products FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "products_select_farmer_own" ON products;
CREATE POLICY "products_select_farmer_own"
ON products FOR SELECT TO authenticated
USING (farmer_id = auth.uid());

DROP POLICY IF EXISTS "products_insert_farmer" ON products;
CREATE POLICY "products_insert_farmer"
ON products FOR INSERT TO authenticated
WITH CHECK (farmer_id = auth.uid() AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'farmer'));

DROP POLICY IF EXISTS "products_update_farmer_or_admin" ON products;
CREATE POLICY "products_update_farmer_or_admin"
ON products FOR UPDATE TO authenticated
USING (farmer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (farmer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "products_delete_farmer_or_admin" ON products;
CREATE POLICY "products_delete_farmer_or_admin"
ON products FOR DELETE TO authenticated
USING (farmer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============ CART POLICIES ============
DROP POLICY IF EXISTS "cart_select_own" ON cart;
CREATE POLICY "cart_select_own"
ON cart FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_insert_own" ON cart;
CREATE POLICY "cart_insert_own"
ON cart FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_update_own" ON cart;
CREATE POLICY "cart_update_own"
ON cart FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cart_delete_own" ON cart;
CREATE POLICY "cart_delete_own"
ON cart FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ ORDERS POLICIES ============
DROP POLICY IF EXISTS "orders_select_own_or_farmer_or_admin" ON orders;
CREATE POLICY "orders_select_own_or_farmer_or_admin"
ON orders FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = orders.id AND p.farmer_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own"
ON orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "orders_update_farmer_or_admin" ON orders;
CREATE POLICY "orders_update_farmer_or_admin"
ON orders FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = orders.id AND p.farmer_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
)
WITH CHECK (true);

DROP POLICY IF EXISTS "orders_delete_admin" ON orders;
CREATE POLICY "orders_delete_admin"
ON orders FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============ ORDER_ITEMS POLICIES ============
DROP POLICY IF EXISTS "order_items_select_own_or_farmer_or_admin" ON order_items;
CREATE POLICY "order_items_select_own_or_farmer_or_admin"
ON order_items FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  OR farmer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
CREATE POLICY "order_items_insert_own"
ON order_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- ============ REVIEWS POLICIES ============
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
CREATE POLICY "reviews_select_all"
ON reviews FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own"
ON reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own"
ON reviews FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reviews_delete_own_or_admin" ON reviews;
CREATE POLICY "reviews_delete_own_or_admin"
ON reviews FOR DELETE TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============ CONTACT POLICIES ============
DROP POLICY IF EXISTS "contact_insert_all" ON contact;
CREATE POLICY "contact_insert_all"
ON contact FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "contact_select_admin" ON contact;
CREATE POLICY "contact_select_admin"
ON contact FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============ TRIGGER: Auto-create profile on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
