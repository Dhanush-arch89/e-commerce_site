-- Aura E-Commerce Database Schema
CREATE DATABASE IF NOT EXISTS aura_ecommerce DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aura_ecommerce;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    badge VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart Table
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_id VARCHAR(50) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    status ENUM('Pending', 'In Transit', 'Completed', 'Cancelled') DEFAULT 'Pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insert Mock Products Data
INSERT INTO products (title, price, category, image_url, badge) VALUES
('Aura Premium Wireless Headphones', 299.99, 'electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', 'Best Seller'),
('Minimalist Mechanical Keyboard', 149.00, 'electronics', 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80', 'New'),
('Ergonomic Executive Chair', 399.50, 'home', 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500&q=80', NULL),
('Matte Black Smart Watch', 199.99, 'electronics', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', NULL),
('Designer Desk Lamp', 89.99, 'home', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80', 'Sale'),
('Leather Weekend Duffel', 245.00, 'fashion', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', NULL),
('Polarized Aviator Sunglasses', 125.00, 'fashion', 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80', NULL),
('Noise-Cancelling Earbuds', 179.99, 'electronics', 'https://images.unsplash.com/photo-1572569433494-2454a72d7f95?w=500&q=80', NULL);

-- Create a mock admin & user (password: admin123)
-- bcrypt hash for 'admin123'
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@aura.com', '$2y$10$QO0kO/q5E4H5hD5Z.zP..u8IhxYkO/c0jB8mCw/LwN2.t5o/.A1vK', 'admin'),
('John Doe', 'john@example.com', '$2y$10$QO0kO/q5E4H5hD5Z.zP..u8IhxYkO/c0jB8mCw/LwN2.t5o/.A1vK', 'customer');
