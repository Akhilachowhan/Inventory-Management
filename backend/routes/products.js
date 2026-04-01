const express = require('express');
const router = express.Router();
const { getDBConnection, executeOnAll, DOWN_NODES } = require('../config/db_utils');
const { logOperation } = require('../config/logger');
const { verifyToken, verifyAdmin } = require('./auth');

router.use(verifyToken);

// Get all products with aggregated distributed stock
router.get('/', async (req, res) => {
    try {
        const activeNode = ['HYD', 'CHE', 'BLR'].find(n => !DOWN_NODES[n]);
        if (!activeNode) return res.status(503).json({ error: 'All database nodes are down. Please enable them in Simulation.' });

        const db = getDBConnection(activeNode);
        const query = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
        `;
        const [rows] = await db.execute(query);
        
        // Bulk-fetch stock from all fragmented nodes asynchronously
        let globalStockMap = {};
        for (let node of ['HYD', 'CHE', 'BLR']) {
            if (!DOWN_NODES[node]) {
                const nodeDb = getDBConnection(node);
                const [sRows] = await nodeDb.execute('SELECT product_id, SUM(quantity) as qty FROM stock GROUP BY product_id');
                for (let sRow of sRows) {
                    globalStockMap[sRow.product_id] = (globalStockMap[sRow.product_id] || 0) + Number(sRow.qty);
                }
            }
        }

        // Aggregate stock dynamically in-memory from the cache
        for (let row of rows) {
            row.quantity = globalStockMap[row.id] || 0;
            row.min_stock = 10;
        }
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create product (Replicated)
router.post('/', async (req, res) => {
    const { name, category_id, price, description, initial_stock } = req.body;
    const query = `INSERT INTO products (name, category_id, price, description) VALUES (?, ?, ?, ?)`;
    try {
        const results = await executeOnAll(query, [name, category_id, price, description]);
        const newProductId = results[0].insertId;
        
        // If an initial stock is provided, allocate it entirely to the primary active warehouse (head office model)
        if (initial_stock && Number(initial_stock) > 0) {
            const primaryNode = ['HYD', 'CHE', 'BLR'].find(n => !DOWN_NODES[n]);
            if (primaryNode) {
                const dbPrimary = getDBConnection(primaryNode);
                await dbPrimary.execute('INSERT INTO stock (product_id, quantity, warehouse) VALUES (?, ?, ?)', [newProductId, Number(initial_stock), primaryNode]);
            }
        }
        
        logOperation('REPLICATE_PRODUCT', ['HYD', 'CHE', 'BLR'], `Product "${name}" successfully replicated to all nodes via 2PC.`);
        res.status(201).json({ message: 'Product replicated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Demo Product
let demoCounter = 0;
const demoTemplates = [
    { prefix: 'Smart TV', category: 1, priceBase: 40000 },
    { prefix: 'Washing Machine', category: 3, priceBase: 15000 },
    { prefix: 'Premium Denim', category: 2, priceBase: 2500 },
    { prefix: 'Wireless Earbuds', category: 1, priceBase: 3500 },
    { prefix: 'Microwave Oven', category: 3, priceBase: 4000 }
];

router.post('/demo', verifyAdmin, async (req, res) => {
    const template = demoTemplates[demoCounter % demoTemplates.length];
    demoCounter++;
    
    const name = `Demo ${template.prefix} ${Math.floor(Math.random() * 999)}`;
    const price = template.priceBase + Math.floor(Math.random() * 500);
    const query = `INSERT INTO products (name, category_id, price, description) VALUES (?, ?, ?, 'Auto-generated test product')`;
    
    try {
        // Execute 2PC insertion
        const results = await executeOnAll(query, [name, template.category, price]);
        const newProductId = results[0].insertId;
        
        // Immediately seed global stock and fake sales so the Reports charts animate beautifully
        for (let node of ['HYD', 'CHE', 'BLR']) {
            if (!DOWN_NODES[node]) {
                const nodeDb = getDBConnection(node);
                
                // Allow a heavily staggered rand pattern to easily simulate 'Low Stock' triggering (< 10 total)
                const isLow = Math.random() > 0.6; // 40% chance of severely low regional allocation
                const randomStock = isLow ? Math.floor(Math.random() * 4) : Math.floor(Math.random() * 30) + 10;
                
                await nodeDb.execute('INSERT INTO stock (product_id, quantity, warehouse) VALUES (?, ?, ?)', [newProductId, randomStock, node]);
                
                const randomSalesQty = Math.floor(Math.random() * 6) + 2; 
                await nodeDb.execute('INSERT INTO sales (product_id, quantity, warehouse, is_demo) VALUES (?, ?, ?, TRUE)', [newProductId, randomSalesQty, node]);
            }
        }

        logOperation('DEMO_PRODUCT', ['HYD', 'CHE', 'BLR'], `Generated dummy product "${name}" and pre-loaded localized sales arrays to animate analytical charts.`);
        res.status(201).json({ message: `Successfully injected ${name} into the catalog!` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Purge Demo Products
router.delete('/demo', verifyAdmin, async (req, res) => {
    try {
        await executeOnAll(`DELETE FROM products WHERE name LIKE 'Demo Product %'`, []);
        logOperation('DEMO_PURGE', ['HYD', 'CHE', 'BLR'], `Purged all synthetic demo products.`);
        res.json({ message: 'Successfully deleted all demo products!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update product (Replicated)
router.put('/:id', async (req, res) => {
    const { name, category_id, price, description } = req.body;
    const query = `UPDATE products SET name = ?, category_id = ?, price = ?, description = ? WHERE id = ?`;
    try {
        await executeOnAll(query, [name, category_id, price, description, req.params.id]);
        res.json({ message: 'Product updated across all nodes' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete product (Replicated)
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        await executeOnAll(`DELETE FROM products WHERE id = ?`, [req.params.id]);
        res.json({ message: 'Product deleted across all nodes' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
