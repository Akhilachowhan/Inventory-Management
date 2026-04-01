const express = require('express');
const router = express.Router();
const { operationLogs } = require('../config/logger');
const { verifyToken, verifyAdmin } = require('./auth');

router.use(verifyToken);

// Get all logs
router.get('/', verifyAdmin, (req, res) => {
    res.json(operationLogs);
});

// Clear logs
router.delete('/', verifyAdmin, (req, res) => {
    operationLogs.length = 0;
    res.json({ message: 'Logs cleared successfully' });
});

module.exports = router;
