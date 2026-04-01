const mysql = require('mysql2/promise');
const dbHydConfig = require('./backend/config/db_hyd').pool.config.connectionConfig;
const dbCheConfig = require('./backend/config/db_che').pool.config.connectionConfig;
const dbBlrConfig = require('./backend/config/db_blr').pool.config.connectionConfig;

async function seedTransactions() {
    console.log('Connecting to databases...');
    const poolHyd = mysql.createPool(dbHydConfig);
    const poolChe = mysql.createPool(dbCheConfig);
    const poolBlr = mysql.createPool(dbBlrConfig);

    const nodes = [
        { loc: 'HYD', db: poolHyd },
        { loc: 'CHE', db: poolChe },
        { loc: 'BLR', db: poolBlr }
    ];

    try {
        for (let node of nodes) {
            console.log(`Processing node ${node.loc}...`);
            const [products] = await node.db.execute('SELECT id, name FROM products');
            if (products.length === 0) continue;

            // 1. Generate Purchases (Stock In)
            console.log(`  -> Generating purchases...`);
            for (let i = 0; i < 15; i++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const qty = Math.floor(Math.random() * 50) + 20; // 20 to 69
                const supplier_id = Math.floor(Math.random() * 3) + 1; // 1 to 3
                const randomPastMs = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // Up to 30 days ago
                const randomDate = new Date(Date.now() - randomPastMs).toISOString().slice(0, 19).replace('T', ' ');

                await node.db.execute(
                    'INSERT INTO purchases (product_id, supplier_id, quantity, date, warehouse) VALUES (?, ?, ?, ?, ?)',
                    [product.id, supplier_id, qty, randomDate, node.loc]
                );

                // Update stock for purchase
                await node.db.execute(
                    'UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse = ?',
                    [qty, product.id, node.loc]
                );
            }

            // 2. Generate Sales (Stock Out)
            console.log(`  -> Generating sales...`);
            for (let i = 0; i < 20; i++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const qty = Math.floor(Math.random() * 5) + 1; // 1 to 5
                const randomPastMs = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // Up to 30 days ago
                const randomDate = new Date(Date.now() - randomPastMs).toISOString().slice(0, 19).replace('T', ' ');

                await node.db.execute(
                    'INSERT INTO sales (product_id, quantity, date, warehouse, customer) VALUES (?, ?, ?, ?, ?)',
                    [product.id, qty, randomDate, node.loc, `Customer ${Math.floor(Math.random() * 999)}`]
                );

                // Update stock for sale
                await node.db.execute(
                    'UPDATE stock SET quantity = GREATEST(quantity - ?, 0) WHERE product_id = ? AND warehouse = ?',
                    [qty, product.id, node.loc]
                );
            }

            // 3. Make some low stock products
            console.log(`  -> Creating low stock anomalies...`);
            for (let i = 0; i < 5; i++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const lowQty = Math.floor(Math.random() * 5); // 0 to 4 (which is < 10)
                await node.db.execute(
                    'UPDATE stock SET quantity = ? WHERE product_id = ? AND warehouse = ?',
                    [lowQty, product.id, node.loc]
                );
            }
        }
        console.log('Successfully completed transactions and low-stock seeding!');
    } catch (err) {
        console.error('Error during seeding:', err);
    }
    process.exit(0);
}

seedTransactions(); sactions.js

