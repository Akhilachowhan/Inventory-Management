const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Initialize tables
        db.serialize(() => {
            // Users Table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'staff', 'manager'))
            )`);

            // Suppliers Table
            db.run(`CREATE TABLE IF NOT EXISTS suppliers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                contact TEXT,
                email TEXT,
                address TEXT
            )`);

            // Categories Table
            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT
            )`);

            // Products Table
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category_id INTEGER,
                supplier_id INTEGER,
                price REAL NOT NULL,
                quantity INTEGER DEFAULT 0,
                min_stock INTEGER DEFAULT 10,
                description TEXT,
                FOREIGN KEY (category_id) REFERENCES categories (id),
                FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
            )`);

            // Purchases (Stock-in) Table
            db.run(`CREATE TABLE IF NOT EXISTS purchases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                supplier_id INTEGER,
                quantity INTEGER NOT NULL,
                purchase_price REAL NOT NULL,
                purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products (id),
                FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
            )`);

            // Sales (Stock-out) Table
            db.run(`CREATE TABLE IF NOT EXISTS sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                sale_price REAL NOT NULL,
                customer_name TEXT,
                sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products (id)
            )`);
            
            // Insert default admin if not exists (password: admin123 hash)
            const bcrypt = require('bcrypt');
            const adminHash = bcrypt.hashSync('admin123', 10); 
            db.get("SELECT id FROM users WHERE username = ?", ["admin"], (err, row) => {
                if (!row) {
                    db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
                        ["admin", adminHash, "admin"]);
                } else {
                    // Force update the password just in case the stored hash was invalid previously
                    db.run("UPDATE users SET password = ? WHERE username = ?", [adminHash, "admin"]);
                }
            });
        });
    }
});

module.exports = db;
