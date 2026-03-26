const express = require('express');
const router = express.Router();
const { getDBConnection, DOWN_NODES } = require('../config/db_utils');
const { verifyToken } = require('./auth');

router.use(verifyToken);

// Record a sale (Stock-out) from a specific warehouse
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
            // Check stock first
            const [stock] = await connection.execute('SELECT quantity FROM stock WHERE product_id = ? AND warehouse = ?', [product_id, warehouse]);
            
            if (stock.length === 0 || stock[0].quantity < quantity) {
                await connection.rollback();
                return res.status(400).json({ error: 'Insufficient stock in ' + warehouse });
            }

            await connection.execute(
                `INSERT INTO sales (product_id, quantity, warehouse) VALUES (?, ?, ?)`,
                [product_id, quantity, warehouse]
            );

            // Deduct stock
            await connection.execute('UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND warehouse = ?', [quantity, product_id, warehouse]);

            await connection.commit();
            res.status(201).json({ message: 'Sale recorded and stock deducted in ' + warehouse });
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

// View sales across all warehouses
router.get('/', async (req, res) => {
    try {
        let allSales = [];
        const nodes = ['HYD', 'CHE', 'BLR'];
        for (let node of nodes) {
            if (!DOWN_NODES[node]) {
                const db = getDBConnection(node);
                const [rows] = await db.execute(`
                    SELECT s.*, pr.name as product_name 
                    FROM sales s 
                    LEFT JOIN products pr ON s.product_id = pr.id 
                    ORDER BY s.date DESC
                `);
                allSales = allSales.concat(rows);
            }
        }
        res.json(allSales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
