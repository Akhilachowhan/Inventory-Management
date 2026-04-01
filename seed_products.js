const mysql = require('mysql2/promise');
const dbHydConfig = require('./backend/config/db_hyd').pool.config.connectionConfig; 
const dbCheConfig = require('./backend/config/db_che').pool.config.connectionConfig;
const dbBlrConfig = require('./backend/config/db_blr').pool.config.connectionConfig;

const demoTemplates = [
    { prefix: 'Smart TV', category: 1, priceBase: 40000 },
    { prefix: 'Washing Machine', category: 3, priceBase: 15000 },
    { prefix: 'Premium Denim', category: 2, priceBase: 2500 },
    { prefix: 'Wireless Earbuds', category: 1, priceBase: 3500 },
    { prefix: 'Microwave Oven', category: 3, priceBase: 4000 },
    { prefix: 'Gaming Monitor', category: 1, priceBase: 25000 },
    { prefix: 'Coffee Maker', category: 3, priceBase: 3500 },
    { prefix: 'Winter Jacket', category: 2, priceBase: 5500 },
    { prefix: 'Mechanical Keyboard', category: 1, priceBase: 8000 },
    { prefix: 'Running Shoes', category: 2, priceBase: 6500 },
    { prefix: 'Tablet', category: 1, priceBase: 32000 }
];

async function seed() {
    console.log('Connecting to databases...');
    const poolHyd = mysql.createPool(dbHydConfig);
    const poolChe = mysql.createPool(dbCheConfig);
    const poolBlr = mysql.createPool(dbBlrConfig);

    const nodes = [
        { loc: 'HYD', db: poolHyd },
        { loc: 'CHE', db: poolChe },
        { loc: 'BLR', db: poolBlr }
    ];

    console.log('Generating 30 products...');
    for (let i = 0; i < 30; i++) {
        const template = demoTemplates[i % demoTemplates.length];
        const name = `${template.prefix} ${Math.floor(Math.random() * 9999)}`;
        const price = template.priceBase + Math.floor(Math.random() * 1000);
        const desc = 'Auto-generated expanded catalog';
        
        let successResult = null;
        try {
            // Replicate product to all nodes
            for (let node of nodes) {
                const [result] = await node.db.execute(
                    'INSERT INTO products (name, category_id, price, description) VALUES (?, ?, ?, ?)',
                    [name, template.category, price, desc]
                );
                successResult = result;
            }

            // If replicated, now inject stock > 0 into each node!
            const newProductId = successResult.insertId;
            for (let node of nodes) {
                // Good stock per warehouse (15 to 60 units)
                const stockQty = Math.floor(Math.random() * 45) + 15;
                await node.db.execute(
                    'INSERT INTO stock (product_id, quantity, warehouse) VALUES (?, ?, ?)',
                    [newProductId, stockQty, node.loc]
                );
            }
            console.log(`Successfully generated ${name} with stock.`);
        } catch (err) {
            console.error('Error seeding:', err);
        }
    }

    // Update existing old products (likely IDs 1 to 5) to have non-zero stock
    // Since user complained "quantity of these prodcuts are mostly 0"
    for (let node of nodes) {
        console.log(`Updating existing stock for node ${node.loc}...`);
        try {
            // Find products that have 0 or no stock
            const [products] = await node.db.execute('SELECT id FROM products WHERE id <= 7');
            for (let p of products) {
                const [stock] = await node.db.execute('SELECT * FROM stock WHERE product_id = ? AND warehouse = ?', [p.id, node.loc]);
                if (stock.length === 0) {
                    await node.db.execute('INSERT INTO stock (product_id, quantity, warehouse) VALUES (?, ?, ?)', [p.id, 25, node.loc]);
                } else if (stock[0].quantity <= 0) {
                    await node.db.execute('UPDATE stock SET quantity = ? WHERE product_id = ? AND warehouse = ?', [25, p.id, node.loc]);
                }
            }
        } catch (err) {
            console.error('Error updating existing stock:', err);
        }
    }

    console.log('Seeding complete! Exiting.');
    process.exit(0);
}

seed();
