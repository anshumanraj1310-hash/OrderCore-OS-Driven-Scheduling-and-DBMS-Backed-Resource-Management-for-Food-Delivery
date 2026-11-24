-- ==============================================================
-- OrderCore Sample Data
-- OS-Driven Scheduling and DBMS-Backed Resource Management
-- ==============================================================

USE ordercore;

-- 1. Customers
INSERT INTO Customer (customer_id, name, phone, address) VALUES
(1, 'Tushar', '9876543210', '12 Rajpur Road, Dehradun'),
(2, 'Rahul', '9876543211', '45 Clock Tower, Dehradun'),
(3, 'Aman', '9876543212', '78 Prem Nagar, Dehradun'),
(4, 'Riya', '9876543213', '89 Clement Town, Dehradun')
ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), address=VALUES(address);

-- 2. Restaurants
INSERT INTO Restaurant (restaurant_id, name, location) VALUES
(1, 'Pizza Hub', 'Rajpur Road, Dehradun'),
(2, 'Burger Point', 'Clock Tower, Dehradun'),
(3, 'Food Corner', 'Prem Nagar, Dehradun'),
(4, 'Spice Garden', 'Sahastradhara Road, Dehradun'),
(5, 'South Bite', 'GMS Road, Dehradun'),
(6, 'Rolls N More', 'Ballupur Chowk, Dehradun'),
(7, 'Dessert Den', 'Paltan Bazaar, Dehradun'),
(8, 'Biryani Blues', 'Astley Hall, Dehradun'),
(9, 'Chai & Tandoor', 'Chakrata Road, Dehradun'),
(10, 'Wok & Roll Asian', 'Jakhan, Dehradun')
ON DUPLICATE KEY UPDATE name=VALUES(name), location=VALUES(location);

-- 3. Expanded Food Items Catalog
INSERT INTO Food (food_id, restaurant_id, name, price) VALUES
-- Pizza Hub (Restaurant 1)
(1, 1, 'Margherita Pizza', 250.00),
(2, 1, 'Farmhouse Pizza', 350.00),
(3, 1, 'Paneer Tikka Pizza', 380.00),
(4, 1, 'Garlic Breadsticks', 140.00),
(5, 1, 'Choco Lava Cake', 110.00),
(6, 1, 'Pepsi Cold Beverage', 60.00),
(53, 1, 'BBQ Chicken Pizza', 420.00),
(54, 1, 'Pasta Arabiata', 220.00),

-- Burger Point (Restaurant 2)
(7, 2, 'Veg Burger', 120.00),
(8, 2, 'Cheese Burger', 180.00),
(9, 2, 'Crispy Paneer Burger', 190.00),
(10, 2, 'Peri Peri Fries', 110.00),
(11, 2, 'Chocolate Thick Shake', 160.00),
(12, 2, 'Crispy Chicken Burger', 220.00),
(55, 2, 'Double Patty Burger', 260.00),
(56, 2, 'Onion Rings', 90.00),

-- Food Corner (Restaurant 3)
(13, 3, 'Veg Noodles', 150.00),
(14, 3, 'Schezwan Fried Rice', 180.00),
(15, 3, 'Paneer Butter Masala', 260.00),
(16, 3, 'Butter Naan', 45.00),
(17, 3, 'Veg Dum Biryani', 220.00),
(18, 3, 'Chicken Biryani', 290.00),
(19, 3, 'Paneer Kathi Roll', 140.00),
(20, 3, 'Gulab Jamun (2 Pcs)', 80.00),

-- Spice Garden (Restaurant 4)
(21, 4, 'Butter Chicken', 320.00),
(22, 4, 'Dal Makhani', 240.00),
(23, 4, 'Palak Paneer', 260.00),
(24, 4, 'Tandoori Roti', 35.00),
(25, 4, 'Chicken Tikka (6 Pcs)', 350.00),
(26, 4, 'Mixed Veg Curry', 220.00),
(27, 4, 'Lassi (Sweet / Salted)', 90.00),
(28, 4, 'Shahi Paneer', 290.00),

-- South Bite (Restaurant 5)
(29, 5, 'Masala Dosa', 130.00),
(30, 5, 'Idli Sambar (4 Pcs)', 100.00),
(31, 5, 'Vada (2 Pcs)', 80.00),
(32, 5, 'Uttapam', 140.00),
(33, 5, 'Pongal', 120.00),
(34, 5, 'Coconut Chutney', 40.00),
(35, 5, 'Filter Coffee', 60.00),
(36, 5, 'Medu Vada (2 Pcs)', 90.00),

-- Rolls N More (Restaurant 6)
(37, 6, 'Paneer Tikka Roll', 160.00),
(38, 6, 'Egg Roll', 110.00),
(39, 6, 'Chicken Tikka Roll', 180.00),
(40, 6, 'Cheese Corn Roll', 150.00),
(41, 6, 'Double Egg Paratha', 130.00),
(42, 6, 'Aloo Paratha with Butter', 100.00),
(43, 6, 'Lassi', 80.00),
(44, 6, 'Veg Frankie', 120.00),

-- Dessert Den (Restaurant 7)
(45, 7, 'Chocolate Brownie', 130.00),
(46, 7, 'Tiramisu', 180.00),
(47, 7, 'Mango Kulfi', 90.00),
(48, 7, 'Belgian Waffle', 160.00),
(49, 7, 'Vanilla Ice Cream Sundae', 140.00),
(50, 7, 'Strawberry Cheesecake', 200.00),
(51, 7, 'Cold Coffee', 110.00),
(52, 7, 'Hot Chocolate', 120.00),

-- Biryani Blues (Restaurant 8)
(57, 8, 'Hyderabadi Chicken Dum Biryani', 320.00),
(58, 8, 'Mutton Lucknowi Biryani', 420.00),
(59, 8, 'Veg Handi Biryani', 240.00),
(60, 8, 'Mirchi Ka Salan', 60.00),
(61, 8, 'Boondi Raita', 50.00),
(62, 8, 'Shahi Tukda', 110.00),

-- Chai & Tandoor (Restaurant 9)
(63, 9, 'Kulhad Masala Chai', 50.00),
(64, 9, 'Amritsari Kulcha with Chole', 160.00),
(65, 9, 'Tandoori Soya Chaap', 210.00),
(66, 9, 'Paneer Tikka Platter', 280.00),
(67, 9, 'Stuffed Garlic Naan', 70.00),
(68, 9, 'Kesar Pista Kulfi', 85.00),

-- Wok & Roll Asian (Restaurant 10)
(69, 10, 'Veg Hakka Noodles', 170.00),
(70, 10, 'Chilli Chicken Dry', 280.00),
(71, 10, 'Veg Dimsums (6 Pcs)', 190.00),
(72, 10, 'Chicken Steamed Momos', 220.00),
(73, 10, 'Manchurian Gravy with Fried Rice', 240.00),
(74, 10, 'Honey Chilli Potato', 180.00)
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price);

-- 4. Delivery Agents
INSERT INTO Delivery_Agents (agent_id, name, status) VALUES
(1, 'Agent A (Arun)', 'Available'),
(2, 'Agent B (Bikram)', 'Available'),
(3, 'Agent C (Chandan)', 'Available')
ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status);

-- 5. Orders (with arrival time, prep time, and OS priority)
INSERT INTO Orders (order_id, customer_id, restaurant_id, arrival_time, prep_time, delivery_time, priority, status) VALUES
(1, 1, 1, 0, 5, 4, 2, 'Waiting'),
(2, 2, 1, 1, 3, 5, 1, 'Waiting'),
(3, 3, 2, 2, 7, 3, 3, 'Waiting'),
(4, 4, 3, 3, 4, 6, 2, 'Waiting'),
(5, 1, 4, 4, 6, 5, 1, 'Waiting'),
(6, 2, 5, 5, 3, 4, 2, 'Waiting'),
(7, 3, 6, 6, 4, 5, 1, 'Waiting'),
(8, 4, 7, 7, 2, 3, 2, 'Waiting'),
(9, 1, 8, 8, 8, 6, 1, 'Waiting'),
(10, 2, 9, 9, 5, 4, 2, 'Waiting'),
(11, 3, 10, 10, 6, 5, 1, 'Waiting')
ON DUPLICATE KEY UPDATE status=VALUES(status), priority=VALUES(priority);

-- 6. Order Items
INSERT INTO Order_Items (order_item_id, order_id, food_id, quantity) VALUES
(1, 1, 1, 2),
(2, 2, 2, 1),
(3, 3, 7, 2),
(4, 4, 13, 1),
(5, 5, 21, 1),
(6, 6, 29, 2),
(7, 7, 37, 2),
(8, 8, 45, 1),
(9, 9, 57, 1),
(10, 10, 63, 2),
(11, 11, 69, 1)
ON DUPLICATE KEY UPDATE quantity=VALUES(quantity);

-- 7. Deliveries
INSERT INTO Delivery (delivery_id, order_id, agent_id, status) VALUES
(1, 1, 1, 'Assigned')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 8. Users (Pre-seeded with hashed passwords)
-- Admin password: 'admin123'
-- Other roles password: 'password123'
INSERT INTO Users (name, email, password_hash, role, customer_id, restaurant_id, agent_id, status) VALUES
-- Admin
('System Administrator', 'admin@ordercore.com', '$2b$10$bARCITOZE9FqEX6b/QmLWe4c1AXBle9/DGmcEUNOlfqsoWrtQRwdq', 'admin', NULL, NULL, NULL, 'Approved'),

-- Customers
('Tushar', 'tushar@example.com', '$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm', 'customer', 1, NULL, NULL, 'Approved'),
('Rahul', 'rahul@example.com', '$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm', 'customer', 2, NULL, NULL, 'Approved'),

-- Restaurants
('Pizza Hub Manager', 'pizzahub@example.com', '$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm', 'restaurant', NULL, 1, NULL, 'Approved'),
('Burger Point Manager', 'burgerpoint@example.com', '$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm', 'restaurant', NULL, 2, NULL, 'Approved'),
('Food Corner Manager', 'foodcorner@example.com', '$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm', 'restaurant', NULL, 3, NULL, 'Approved'),
('Green Delight Cafe (Pending)', 'greendelight@example.com', '$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm', 'restaurant', NULL, 3, NULL, 'Pending'),

-- Delivery Agents
('Agent A (Arun)', 'agenta@example.com', '$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm', 'delivery_agent', NULL, NULL, 1, 'Approved'),
('Agent B (Bikram)', 'agentb@example.com', '$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm', 'delivery_agent', NULL, NULL, 2, 'Approved'),
('Agent C (Chandan)', 'agentc@example.com', '$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm', 'delivery_agent', NULL, NULL, 3, 'Approved'),
('Express Rider (Pending)', 'rider@example.com', '$2b$10$fJW0f9KNGvccSuFWqw9SXuut38KWL.YDg9an1POvqFsw7jSRDl3Tm', 'delivery_agent', NULL, NULL, 3, 'Pending')
ON DUPLICATE KEY UPDATE status=VALUES(status);
