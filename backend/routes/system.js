const express = require('express');
const router = express.Router();
const { getDBConnection, DOWN_NODES } = require('../config/db_utils');
const { logOperation } = require('../config/logger');
const { verifyToken } = require('./auth');

router.use(verifyToken);

// Toggle node status for fault tolerance simulation
router.post('/toggle-node', (req, res) => {
    const { location, status } = req.body;
    
    if (!['HYD', 'CHE', 'BLR'].includes(location?.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid location' });
    }
    
    // status should be true to "disable" and false to "enable"
    DOWN_NODES[location.toUpperCase()] = status === 'down';
    logOperation('NODE_CONFIG', [location.toUpperCase()], `Simulated network config changed: Node is now ${status.toUpperCase()}`);
    
    res.json({ message: `Node ${location.toUpperCase()} is now ${DOWN_NODES[location.toUpperCase()] ? 'DOWN' : 'UP'}`, nodes: DOWN_NODES });
});

router.get('/status', (req, res) => {
    res.json({ nodes: DOWN_NODES });
});

router.post('/demo-data', async (req, res) => {
    try {
        const locations = ['HYD', 'CHE', 'BLR'];
        let injected = 0;
        
        for (let loc of locations) {
            if (DOWN_NODES[loc]) continue;
            const db = getDBConnection(loc);
            
            const [prods] = await db.execute('SELECT id FROM products LIMIT 3');
            if (prods.length === 0) throw new Error(`Cannot generate demo data: No products exist in node ${loc}! Please add at least 1 product.`);
            
            // Demo Purchases
            const purchases = prods.map((p, i) => ({ pid: p.id, qty: (i + 1) * 50 }));
            for (let p of purchases) {
                await db.execute('INSERT INTO purchases (product_id, quantity, warehouse, is_demo) VALUES (?, ?, ?, TRUE)', [p.pid, p.qty, loc]);
                const [stock] = await db.execute('SELECT quantity FROM stock WHERE product_id = ? AND warehouse = ?', [p.pid, loc]);
                if (stock.length > 0) {
                    await db.execute('UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse = ?', [p.qty, p.pid, loc]);
                } else {
                    await db.execute('INSERT INTO stock (product_id, quantity, warehouse) VALUES (?, ?, ?)', [p.pid, p.qty, loc]);
                }
            }
            
            // Demo Sales
            const sales = prods.slice(0, 2).map((p, i) => ({ pid: p.id, qty: (i + 1) * 20 }));
            for (let s of sales) {
                await db.execute('INSERT INTO sales (product_id, quantity, warehouse, is_demo) VALUES (?, ?, ?, TRUE)', [s.pid, s.qty, loc]);
                await db.execute('UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND warehouse = ?', [s.qty, s.pid, loc]);
            }
            injected++;
        }
        logOperation('DEMO_GENERATION', locations, `Generated synthetic transactions (Purchases & Sales) seamlessly spread across ${injected} active nodes`);
        res.json({ message: `Successfully injected demo transactions into ${injected} active warehouses! (Wait 2 seconds and click Refresh)` });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// Purge all transactions (Clear Data)
router.delete('/demo-data', async (req, res) => {
    try {
        const locations = ['HYD', 'CHE', 'BLR'];
        let cleared = 0;
        for (let loc of locations) {
            if (DOWN_NODES[loc]) continue;
            const db = getDBConnection(loc);
            
            // First, reverse the stock inflation caused by demo purchases
            const [demoPurchases] = await db.execute('SELECT product_id, SUM(quantity) as total_qty FROM purchases WHERE is_demo = TRUE GROUP BY product_id');
            for (let dp of demoPurchases) {
                await db.execute('UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND warehouse = ?', [dp.total_qty, dp.product_id, loc]);
            }
            
            // Second, reverse stock deflation caused by demo sales
            const [demoSales] = await db.execute('SELECT product_id, SUM(quantity) as total_qty FROM sales WHERE is_demo = TRUE GROUP BY product_id');
            for (let ds of demoSales) {
                await db.execute('UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse = ?', [ds.total_qty, ds.product_id, loc]);
            }

            // Finally, cleanly delete the flagged demo transactions while keeping real records intact
            await db.execute('DELETE FROM sales WHERE is_demo = TRUE');
            await db.execute('DELETE FROM purchases WHERE is_demo = TRUE');
            
            cleared++;
        }
        logOperation('DATA_PURGE', locations, `Purged all sales, purchases, and reset stock quantities across ${cleared} active nodes!`);
        res.json({ message: `Successfully cleared all transactions from ${cleared} databases!` });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
