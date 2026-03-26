-- Drop existing databases if any to start fresh
DROP DATABASE IF EXISTS inventory_hyd;
DROP DATABASE IF EXISTS inventory_che;
DROP DATABASE IF EXISTS inventory_blr;

-- Create databases
CREATE DATABASE inventory_hyd;
CREATE DATABASE inventory_che;
CREATE DATABASE inventory_blr;

-- ==========================================
-- SETUP HYDERABAD (HYD) DATABASE
-- ==========================================
USE inventory_hyd;

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(50),
    address TEXT
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id INT,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Staff') NOT NULL
);

CREATE TABLE stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    quantity INT DEFAULT 0,
    warehouse VARCHAR(10) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    quantity INT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    warehouse VARCHAR(10) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    quantity INT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    warehouse VARCHAR(10) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

INSERT INTO categories (name) VALUES ('Electronics'), ('Clothing'), ('Home Appliances');
INSERT INTO suppliers (name, contact, address) VALUES ('Supplier A', '1234567890', 'Mumbai'), ('Supplier B', '0987654321', 'Delhi'), ('Supplier C', '1122334455', 'Pune');
INSERT INTO products (name, category_id, price, description) VALUES ('Smartphone', 1, 15000.00, 'Latest smartphone model'), ('T-Shirt', 2, 500.00, 'Cotton T-Shirt'), ('Mixer Grinder', 3, 2500.00, '750W Mixer'), ('Laptop', 1, 55000.00, 'Gaming laptop'), ('Jeans', 2, 1200.00, 'Denim jeans');
INSERT INTO users (username, password, role) VALUES ('admin', '$2b$10$C82o50Wk0C6lVqY7E.24qOiK.gUo0iF1I4E1A/T8F.A8lDk8A6R1i', 'Admin');

-- ==========================================
-- SETUP CHENNAI (CHE) DATABASE
-- ==========================================
USE inventory_che;

CREATE TABLE categories ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL );
CREATE TABLE suppliers ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, contact VARCHAR(50), address TEXT );
CREATE TABLE products ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, category_id INT, price DECIMAL(10, 2) NOT NULL, description TEXT, FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL );
CREATE TABLE users ( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role ENUM('Admin', 'Staff') NOT NULL );
CREATE TABLE stock ( id INT AUTO_INCREMENT PRIMARY KEY, product_id INT, quantity INT DEFAULT 0, warehouse VARCHAR(10) NOT NULL, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE );
CREATE TABLE sales ( id INT AUTO_INCREMENT PRIMARY KEY, product_id INT, quantity INT NOT NULL, date DATETIME DEFAULT CURRENT_TIMESTAMP, warehouse VARCHAR(10) NOT NULL, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE );
CREATE TABLE purchases ( id INT AUTO_INCREMENT PRIMARY KEY, product_id INT, quantity INT NOT NULL, date DATETIME DEFAULT CURRENT_TIMESTAMP, warehouse VARCHAR(10) NOT NULL, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE );

INSERT INTO categories (name) VALUES ('Electronics'), ('Clothing'), ('Home Appliances');
INSERT INTO suppliers (name, contact, address) VALUES ('Supplier A', '1234567890', 'Mumbai'), ('Supplier B', '0987654321', 'Delhi'), ('Supplier C', '1122334455', 'Pune');
INSERT INTO products (name, category_id, price, description) VALUES ('Smartphone', 1, 15000.00, 'Latest smartphone model'), ('T-Shirt', 2, 500.00, 'Cotton T-Shirt'), ('Mixer Grinder', 3, 2500.00, '750W Mixer'), ('Laptop', 1, 55000.00, 'Gaming laptop'), ('Jeans', 2, 1200.00, 'Denim jeans');
INSERT INTO users (username, password, role) VALUES ('admin', '$2b$10$C82o50Wk0C6lVqY7E.24qOiK.gUo0iF1I4E1A/T8F.A8lDk8A6R1i', 'Admin');

-- ==========================================
-- SETUP BANGALORE (BLR) DATABASE
-- ==========================================
USE inventory_blr;

CREATE TABLE categories ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL );
CREATE TABLE suppliers ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, contact VARCHAR(50), address TEXT );
CREATE TABLE products ( id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, category_id INT, price DECIMAL(10, 2) NOT NULL, description TEXT, FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL );
CREATE TABLE users ( id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role ENUM('Admin', 'Staff') NOT NULL );
CREATE TABLE stock ( id INT AUTO_INCREMENT PRIMARY KEY, product_id INT, quantity INT DEFAULT 0, warehouse VARCHAR(10) NOT NULL, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE );
CREATE TABLE sales ( id INT AUTO_INCREMENT PRIMARY KEY, product_id INT, quantity INT NOT NULL, date DATETIME DEFAULT CURRENT_TIMESTAMP, warehouse VARCHAR(10) NOT NULL, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE );
CREATE TABLE purchases ( id INT AUTO_INCREMENT PRIMARY KEY, product_id INT, quantity INT NOT NULL, date DATETIME DEFAULT CURRENT_TIMESTAMP, warehouse VARCHAR(10) NOT NULL, FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE );

INSERT INTO categories (name) VALUES ('Electronics'), ('Clothing'), ('Home Appliances');
INSERT INTO suppliers (name, contact, address) VALUES ('Supplier A', '1234567890', 'Mumbai'), ('Supplier B', '0987654321', 'Delhi'), ('Supplier C', '1122334455', 'Pune');
INSERT INTO products (name, category_id, price, description) VALUES ('Smartphone', 1, 15000.00, 'Latest smartphone model'), ('T-Shirt', 2, 500.00, 'Cotton T-Shirt'), ('Mixer Grinder', 3, 2500.00, '750W Mixer'), ('Laptop', 1, 55000.00, 'Gaming laptop'), ('Jeans', 2, 1200.00, 'Denim jeans');
INSERT INTO users (username, password, role) VALUES ('admin', '$2b$10$C82o50Wk0C6lVqY7E.24qOiK.gUo0iF1I4E1A/T8F.A8lDk8A6R1i', 'Admin');
