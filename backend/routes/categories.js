const express = require('express');
const router = express.Router();
const { getDBConnection, executeOnAll } = require('../config/db_utils');
const { verifyToken } = require('./auth');

router.use(verifyToken);

// Get all categories (Read from one DB - e.g. HYD)
router.get('/', async (req, res) => {
    try {
        const db = getDBConnection('HYD');
        const [rows] = await db.execute('SELECT * FROM categories');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create category (Replicated across all DBs)
router.post('/', async (req, res) => {
    const { name } = req.body;
    try {
        // executeOnAll runs the query on all 3 databases
        await executeOnAll('INSERT INTO categories (name) VALUES (?)', [name]);
        res.status(201).json({ message: 'Category added to all nodes' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
