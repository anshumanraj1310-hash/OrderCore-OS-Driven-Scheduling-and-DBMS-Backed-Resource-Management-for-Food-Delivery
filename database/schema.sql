-- ==============================================================
-- OrderCore Database Schema
-- OS-Driven Scheduling and DBMS-Backed Resource Management
-- ==============================================================

CREATE DATABASE IF NOT EXISTS ordercore;
USE ordercore;

-- 1. Customer Table
CREATE TABLE IF NOT EXISTS Customer (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    address VARCHAR(255)
);

-- 2. Restaurant Table
CREATE TABLE IF NOT EXISTS Restaurant (
    restaurant_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255)
);

-- 3. Food Table
CREATE TABLE IF NOT EXISTS Food (
    food_id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id) ON DELETE CASCADE
);

-- 4. Delivery Agents Table
CREATE TABLE IF NOT EXISTS Delivery_Agents (
    agent_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'Available'
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS Orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    arrival_time INT NOT NULL DEFAULT 0,
    prep_time INT NOT NULL DEFAULT 10,
    delivery_time INT NOT NULL DEFAULT 15,
    priority INT NOT NULL DEFAULT 2,
    status VARCHAR(30) DEFAULT 'Waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id) ON DELETE CASCADE
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS Order_Items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    food_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES Food(food_id) ON DELETE CASCADE
);

-- 7. Delivery Table
CREATE TABLE IF NOT EXISTS Delivery (
    delivery_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    agent_id INT NOT NULL,
    status VARCHAR(30) DEFAULT 'Assigned',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES Delivery_Agents(agent_id) ON DELETE CASCADE
);

-- 8. Users Table (Authentication & Role-Based Access Control)
CREATE TABLE IF NOT EXISTS Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'customer', 'restaurant', 'delivery_agent') NOT NULL,
    customer_id INT NULL,
    restaurant_id INT NULL,
    agent_id INT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES Delivery_Agents(agent_id) ON DELETE CASCADE
);
