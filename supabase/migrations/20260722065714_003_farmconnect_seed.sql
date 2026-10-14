/*
# FarmConnect - Seed Sample Data

Seeds initial categories and sample products so the marketplace isn't empty on first load.
Note: Products require farmer profiles, which require auth.users entries. Since we can't
create auth users via SQL, we seed only categories here. Products will be created by
farmers through the app UI. We also insert placeholder categories with proper slugs.

## Data
- 8 product categories (Vegetables, Fruits, Grains, Dairy, Herbs, Organic, Nuts, Honey)
*/

INSERT INTO categories (name, slug, icon, description) VALUES
  ('Vegetables', 'vegetables', 'fa-carrot', 'Fresh vegetables from local farms'),
  ('Fruits', 'fruits', 'fa-apple-whole', 'Seasonal fruits grown naturally'),
  ('Grains', 'grains', 'fa-wheat-awn', 'Whole grains and cereals'),
  ('Dairy', 'dairy', 'fa-cheese', 'Fresh dairy products from local farms'),
  ('Herbs', 'herbs', 'fa-leaf', 'Aromatic herbs and spices'),
  ('Organic', 'organic', 'fa-seedling', 'Certified organic produce'),
  ('Nuts', 'nuts', 'fa-cookie', 'Fresh nuts and seeds'),
  ('Honey', 'honey', 'fa-jar', 'Pure natural honey')
ON CONFLICT (slug) DO NOTHING;
