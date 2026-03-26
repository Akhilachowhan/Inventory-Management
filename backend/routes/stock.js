const express = require('express');
const router = express.Router();
const { getDBConnection, DOWN_NODES } = require('../config/db_utils');
const { verifyToken } = require('./auth');

router.use(verifyToken);

// Update stock for a specific warehouse
router.post('/update', async (req, res) => {
    const { product_id, quantity, location } = req.body;
    
    if (!['HYD', 'CHE', 'BLR'].includes(location?.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid location' });
    }

    const warehouse = location.toUpperCase();
    try {
        const db = getDBConnection(warehouse);
        const [existing] = await db.execute('SELECT quantity FROM stock WHERE product_id = ? AND warehouse = ?', [product_id, warehouse]);
        
        if (existing.length > 0) {
            await db.execute('UPDATE stock SET quantity = ? WHERE product_id = ? AND warehouse = ?', [quantity, product_id, warehouse]);
        } else {
            await db.execute('INSERT INTO stock (product_id, quantity, warehouse) VALUES (?, ?, ?)', [product_id, quantity, warehouse]);
        }
        res.status(200).json({ message: 'Stock updated in ' + warehouse });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// View stock per warehouse
router.get('/:location', async (req, res) => {
    const warehouse = req.params.location.toUpperCase();
    try {
        const db = getDBConnection(warehouse);
        const [rows] = await db.execute(`
            SELECT s.*, p.name as product_name 
            FROM stock s JOIN products p ON s.product_id = p.id 
            WHERE s.warehouse = ?`, [warehouse]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Show combined stock across all warehouses
router.get('/total/:productId', async (req, res) => {
    const productId = req.params.productId;
    let totalStock = 0;
    
    // Distributed query: Aggregate results from all 3 DBs
    const nodes = ['HYD', 'CHE', 'BLR'];
    const activeNodes = [];
    
    try {
        for (let node of nodes) {
            if (!DOWN_NODES[node]) {
                const db = getDBConnection(node);
                const [rows] = await db.execute('SELECT quantity FROM stock WHERE product_id = ?', [productId]);
                if (rows.length > 0) {
                    totalStock += rows[0].quantity;
                }
                activeNodes.push(node);
            }
        }
        res.json({ product_id: productId, total_quantity: totalStock, queried_nodes: activeNodes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
