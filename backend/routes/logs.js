const express = require('express');
const router = express.Router();
const { operationLogs } = require('../config/logger');
const { verifyToken } = require('./auth');

router.use(verifyToken);

// Get all logs
router.get('/', (req, res) => {
    res.json(operationLogs);
});

// Clear logs
router.delete('/', (req, res) => {
    operationLogs.length = 0;
    res.json({ message: 'Logs cleared successfully' });
});

module.exports = router;
