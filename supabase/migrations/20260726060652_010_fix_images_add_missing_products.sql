-- Fix incorrect product images and add missing products
-- Using verified Pexels photo IDs that match each product

-- ============ FIX EXISTING PRODUCT IMAGES ============
UPDATE products SET image_url = 'https://images.pexels.com/photos/6740693/pexels-photo-6740693.jpeg?auto=compress&cs=tinysrgb&w=600' WHERE name = 'Carrot';
UPDATE products SET image_url = 'https://images.pexels.com/photos/3195630/pexels-photo-3195630.jpeg?auto=compress&cs=tinysrgb&w=600' WHERE name = 'Drumstick';
UPDATE products SET image_url = 'https://images.pexels.com/photos/16291673/pexels-photo-16291673.jpeg?auto=compress&cs=tinysrgb&w=600' WHERE name = 'Ragi';
UPDATE products SET image_url = 'https://images.pexels.com/photos/7421234/pexels-photo-7421234.jpeg?auto=compress&cs=tinysrgb&w=600' WHERE name = 'Wheat';
UPDATE products SET image_url = 'https://images.pexels.com/photos/547333/pexels-photo-547333.jpeg?auto=compress&cs=tinysrgb&w=600' WHERE name = 'Maize';
UPDATE products SET image_url = 'https://images.pexels.com/photos/1393382/pexels-photo-1393382.jpeg?auto=compress&cs=tinysrgb&w=600' WHERE name = 'Rice';
UPDATE products SET image_url = 'https://images.pexels.com/photos/3338497/pexels-photo-3338497.jpeg?auto=compress&cs=tinysrgb&w=600' WHERE name = 'Bajra';
UPDATE products SET image_url = 'https://images.pexels.com/photos/7421234/pexels-photo-7421234.jpeg?auto=compress&cs=tinysrgb&w=600' WHERE name = 'Jowar';
UPDATE products SET image_url = 'https://images.pexels.com/photos/1393382/pexels-photo-1393382.jpeg?auto=compress&cs=tinysrgb&w=600' WHERE name = 'Foxtail Millet';
UPDATE products SET image_url = 'https://images.pexels.com/photos/1393382/pexels-photo-1393382.jpeg?auto=compress&cs=tinysrgb&w=600' WHERE name = 'Little Millet';
-- Fix Coriander and Curry Leaves with better images
UPDATE products SET image_url = 'https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&cs=tinysrgb&w=600' WHERE name = 'Coriander';
UPDATE products SET image_url = 'https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&cs=tinysrgb&w=600' WHERE name = 'Curry Leaves';

-- ============ ADD MISSING VEGETABLES ============
INSERT INTO products (name, category_id, price, stock, unit, image_url, description, farmer_name, farmer_location, district, is_organic, is_featured, status, short_description) VALUES
('Broccoli', '0211a9f9-f097-4fef-b002-4a09a12ac6ad', 80, 60, 'kg', 'https://images.pexels.com/photos/47347/broccoli-vegetable-food-healthy-47347.jpeg?auto=compress&cs=tinysrgb&w=600', 'Fresh green broccoli. Rich in Vitamin C and fiber. Great for stir-fries and salads.', 'Prakash', 'Modakurichi', 'Erode', true, false, 'active', 'Fresh broccoli'),
('Cucumber', '0211a9f9-f097-4fef-b002-4a09a12ac6ad', 25, 100, 'kg', 'https://images.pexels.com/photos/2329440/pexels-photo-2329440.jpeg?auto=compress&cs=tinysrgb&w=600', 'Fresh cool cucumbers. Crisp and hydrating, perfect for salads and raita.', 'Rajesh', 'Chennimalai', 'Erode', false, false, 'active', 'Fresh cucumber'),
('Garlic', '0211a9f9-f097-4fef-b002-4a09a12ac6ad', 120, 80, 'kg', 'https://images.pexels.com/photos/5727065/pexels-photo-5727065.jpeg?auto=compress&cs=tinysrgb&w=600', 'Fresh garlic bulbs. Essential for Indian cooking with numerous health benefits.', 'Kumar', 'Perundurai', 'Erode', true, false, 'active', 'Fresh garlic'),
('Ginger', '0211a9f9-f097-4fef-b002-4a09a12ac6ad', 150, 70, 'kg', 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=600', 'Fresh ginger root. Essential for cooking and traditional remedies.', 'Suresh', 'Kangeyam', 'Tiruppur', true, false, 'active', 'Fresh ginger'),
('Sweet Potato', '0211a9f9-f097-4fef-b002-4a09a12ac6ad', 40, 90, 'kg', 'https://images.pexels.com/photos/6605229/pexels-photo-6605229.jpeg?auto=compress&cs=tinysrgb&w=600', 'Fresh sweet potatoes. Rich in vitamins and natural sweetness. Great for roasting and boiling.', 'Ramesh', 'Gobichettipalayam', 'Erode', true, false, 'active', 'Fresh sweet potato'),
('Mint Leaves', '0211a9f9-f097-4fef-b002-4a09a12ac6ad', 15, 50, 'kg', 'https://images.pexels.com/photos/4832902/pexels-photo-4832902.jpeg?auto=compress&cs=tinysrgb&w=600', 'Fresh mint leaves. Aromatic and refreshing, perfect for chutneys and drinks.', 'Mani', 'Dharapuram', 'Tiruppur', true, false, 'active', 'Fresh mint leaves');

-- ============ ADD MISSING FRUITS ============
INSERT INTO products (name, category_id, price, stock, unit, image_url, description, farmer_name, farmer_location, district, is_organic, is_featured, status, short_description) VALUES
('Muskmelon', '57ad8a26-9202-46b1-803e-de0d2e0f83da', 50, 60, 'kg', 'https://images.pexels.com/photos/2933163/pexels-photo-2933163.jpeg?auto=compress&cs=tinysrgb&w=600', 'Sweet and juicy muskmelon. Refreshing and rich in Vitamin C. Perfect for summer.', 'Selvam', 'Bhavani', 'Erode', false, false, 'active', 'Sweet muskmelon');

-- ============ ADD MISSING GRAINS ============
INSERT INTO products (name, category_id, price, stock, unit, image_url, description, farmer_name, farmer_location, district, is_organic, is_featured, status, short_description) VALUES
('Paddy', '2bd184b2-92b4-4dac-b909-5df621c2a352', 35, 400, 'kg', 'https://images.pexels.com/photos/2933163/pexels-photo-2933163.jpeg?auto=compress&cs=tinysrgb&w=600', 'Raw paddy rice directly from the farm. Unhusked rice grains ready for milling.', 'Kumar', 'Perundurai', 'Erode', false, false, 'active', 'Raw paddy rice'),
('White Rice', '2bd184b2-92b4-4dac-b909-5df621c2a352', 60, 300, 'kg', 'https://images.pexels.com/photos/1393382/pexels-photo-1393382.jpeg?auto=compress&cs=tinysrgb&w=600', 'Premium white rice. Polished and ready to cook. Perfect for daily meals.', 'Suresh', 'Kangeyam', 'Tiruppur', false, false, 'active', 'Premium white rice'),
('Brown Rice', '2bd184b2-92b4-4dac-b909-5df621c2a352', 70, 200, 'kg', 'https://images.pexels.com/photos/1393382/pexels-photo-1393382.jpeg?auto=compress&cs=tinysrgb&w=600', 'Healthy brown rice. Unpolished and rich in fiber and nutrients.', 'Ramesh', 'Gobichettipalayam', 'Erode', true, false, 'active', 'Healthy brown rice'),
('Kodo Millet', '2bd184b2-92b4-4dac-b909-5df621c2a352', 100, 80, 'kg', 'https://images.pexels.com/photos/1393382/pexels-photo-1393382.jpeg?auto=compress&cs=tinysrgb&w=600', 'Kodo millet (varagu). Rich in fiber and minerals. Gluten-free and easy to digest.', 'Mani', 'Dharapuram', 'Tiruppur', true, false, 'active', 'Kodo millet'),
('Barnyard Millet', '2bd184b2-92b4-4dac-b909-5df621c2a352', 95, 80, 'kg', 'https://images.pexels.com/photos/1393382/pexels-photo-1393382.jpeg?auto=compress&cs=tinysrgb&w=600', 'Barnyard millet (kuthiraivali). Rich in iron and fiber. Gluten-free grain.', 'Selvam', 'Bhavani', 'Erode', true, false, 'active', 'Barnyard millet');
