const express = require('express');
const router = express.Router();
const { getDBConnection, DOWN_NODES } = require('../config/db_utils');
const { verifyToken } = require('./auth');

router.use(verifyToken);

// Record a purchase (Stock-in) into a specific warehouse
router.post('/', async (req, res) => {
    const { product_id, quantity, location } = req.body;
    
    if (!['HYD', 'CHE', 'BLR'].includes(location?.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid location' });
    }

    const warehouse = location.toUpperCase();
    try {
        const db = getDBConnection(warehouse);
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            await connection.execute(
                `INSERT INTO purchases (product_id, quantity, warehouse) VALUES (?, ?, ?)`,
                [product_id, quantity, warehouse]
            );

            // Add stock
            const [stock] = await connection.execute('SELECT quantity FROM stock WHERE product_id = ? AND warehouse = ?', [product_id, warehouse]);
            if (stock.length > 0) {
                await connection.execute('UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse = ?', [quantity, product_id, warehouse]);
            } else {
                await connection.execute('INSERT INTO stock (product_id, quantity, warehouse) VALUES (?, ?, ?)', [product_id, quantity, warehouse]);
            }

            await connection.commit();
            res.status(201).json({ message: 'Purchase recorded and stock added in ' + warehouse });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// View purchases across all warehouses or specific
router.get('/', async (req, res) => {
    try {
        let allPurchases = [];
        const nodes = ['HYD', 'CHE', 'BLR'];
        for (let node of nodes) {
            if (!DOWN_NODES[node]) {
                const db = getDBConnection(node);
                const [rows] = await db.execute(`
                    SELECT p.*, pr.name as product_name 
                    FROM purchases p 
                    LEFT JOIN products pr ON p.product_id = pr.id 
                    ORDER BY p.date DESC
                `);
                allPurchases = allPurchases.concat(rows);
            }
        }
        res.json(allPurchases);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
