const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'inventory.db');
const db = new sqlite3.Database(dbPath);

const csvDir = path.join(__dirname, 'csv_demo_files');

db.serialize(() => {
    // 1. Get or create Categories based on the CSV files
    
    fs.readdirSync(csvDir).forEach(file => {
        if (!file.endsWith('.csv')) return;
        
        const filePath = path.join(csvDir, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        if (lines.length <= 1) return;
        const headers = lines[0].split(',');
        
        const stmtCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
        
        lines.slice(1).forEach(line => {
            // Note: handles basic quotes for Apple iPhone 14,"Electronics",79999,9
            // This is a naive split, let's use a regex to properly split CSV
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (values.length < 4) return;
            
            const name = values[0].replace(/^"|"$/g, '').trim();
            const category = values[1].replace(/^"|"$/g, '').trim();
            const price = parseFloat(values[2].replace(/^"|"$/g, '').trim());
            const qty = parseInt(values[3].replace(/^"|"$/g, '').trim());
            
            // Insert category
            stmtCategory.run(category);
        });
        stmtCategory.finalize();
    });

    // 2. Insert Products natively linking to categories
    fs.readdirSync(csvDir).forEach(file => {
        if (!file.endsWith('.csv')) return;
        
        const filePath = path.join(csvDir, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        lines.slice(1).forEach(line => {
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (values.length < 4) return;
            
            const name = values[0].replace(/^"|"$/g, '').trim();
            const category = values[1].replace(/^"|"$/g, '').trim();
            const price = parseFloat(values[2].replace(/^"|"$/g, '').trim());
            const qty = parseInt(values[3].replace(/^"|"$/g, '').trim());
            
            // Look up category id and insert
            db.get("SELECT id FROM categories WHERE name = ?", [category], (err, row) => {
                if (row) {
                    db.run("INSERT INTO products (name, category_id, price, quantity, min_stock, supplier_id) VALUES (?, ?, ?, ?, ?, ?)", 
                           [name, row.id, price, qty, 10, null]);
                } else {
                    db.run("INSERT INTO products (name, category_id, price, quantity, min_stock, supplier_id) VALUES (?, ?, ?, ?, ?, ?)", 
                           [name, null, price, qty, 10, null]);
                }
            });
        });
    });
});

setTimeout(() => {
    db.close((err) => {
        if(err) console.error(err);
        else console.log("Import completed successfully.");
    });
}, 2000); // 2 second timeout to allow db callbacks to flush
