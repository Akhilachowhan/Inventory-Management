const express = require('express');
const router = express.Router();
const { getDBConnection, executeOnAll } = require('../config/db_utils');
const { verifyToken, verifyAdmin } = require('./auth');

router.use(verifyToken);

// Get all suppliers
router.get('/', async (req, res) => {
    try {
        const db = getDBConnection('HYD');
        const [rows] = await db.execute('SELECT * FROM suppliers');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create supplier (Replicated)
router.post('/', async (req, res) => {
    const { name, contact, address } = req.body;
    try {
        await executeOnAll('INSERT INTO suppliers (name, contact, address) VALUES (?, ?, ?)', [name, contact, address]);
        res.status(201).json({ message: 'Supplier replicated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update supplier (Replicated)
router.put('/:id', async (req, res) => {
    const { name, contact, address } = req.body;
    try {
        await executeOnAll('UPDATE suppliers SET name = ?, contact = ?, address = ? WHERE id = ?', 
            [name, contact, address, req.params.id]);
        res.json({ message: 'Supplier replicated update successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete supplier (Replicated)
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        await executeOnAll('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
        res.json({ message: 'Supplier replicated delete successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
