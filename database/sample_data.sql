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
(3, 'Food Corner', 'Prem Nagar, Dehradun')
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

-- Burger Point (Restaurant 2)
(7, 2, 'Veg Burger', 120.00),
(8, 2, 'Cheese Burger', 180.00),
(9, 2, 'Crispy Paneer Burger', 190.00),
(10, 2, 'Peri Peri Fries', 110.00),
(11, 2, 'Chocolate Thick Shake', 160.00),
(12, 2, 'Crispy Chicken Burger', 220.00),

-- Food Corner (Restaurant 3)
(13, 3, 'Veg Noodles', 150.00),
(14, 3, 'Schezwan Fried Rice', 180.00),
(15, 3, 'Paneer Butter Masala', 260.00),
(16, 3, 'Butter Naan', 45.00),
(17, 3, 'Veg Dum Biryani', 220.00),
(18, 3, 'Chicken Biryani', 290.00),
(19, 3, 'Paneer Kathi Roll', 140.00),
(20, 3, 'Gulab Jamun (2 Pcs)', 80.00)
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
(4, 4, 3, 3, 4, 6, 2, 'Waiting')
ON DUPLICATE KEY UPDATE status=VALUES(status), priority=VALUES(priority);

-- 6. Order Items
INSERT INTO Order_Items (order_item_id, order_id, food_id, quantity) VALUES
(1, 1, 1, 2),
(2, 2, 2, 1),
(3, 3, 7, 2),
(4, 4, 13, 1)
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
