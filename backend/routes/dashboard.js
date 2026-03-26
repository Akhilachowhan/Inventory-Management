const express = require('express');
const router = express.Router();
const { getDBConnection, DOWN_NODES } = require('../config/db_utils');
const { verifyToken } = require('./auth');

router.use(verifyToken);

router.get('/metrics', async (req, res) => {
    let metrics = { totalProducts: 0, totalInventoryStock: 0, totalRevenue: 0, activeNodes: [], lowStockCount: 0 };

    const nodes = ['HYD', 'CHE', 'BLR'];
    
    try {
        // Total products (replicated, so query any active once)
        const primaryNode = nodes.find(n => !DOWN_NODES[n]);
        if (primaryNode) {
            const dbPrimary = getDBConnection(primaryNode);
            const [pRow] = await dbPrimary.execute('SELECT id, price FROM products');
            metrics.totalProducts = pRow.length;
            
            // Dynamically calculate "Low Stock" and "Total Inventory Value" by cross-querying all fragmented stock nodes globally
            let lowCount = 0;
            let invValue = 0;
            for (let product of pRow) {
                let trueGlobalQty = 0;
                for (let n of nodes) {
                    if (!DOWN_NODES[n]) {
                       const [sRow] = await getDBConnection(n).execute('SELECT SUM(quantity) as qty FROM stock WHERE product_id = ?', [product.id]);
                       if (sRow.length > 0 && sRow[0].qty) trueGlobalQty += Number(sRow[0].qty);
                    }
                }
                if (trueGlobalQty <= 10) lowCount++;
                invValue += (trueGlobalQty * Number(product.price || 0));
            }
            metrics.lowStockCount = lowCount;
            metrics.totalInventoryStockValue = invValue;
        }

        // Data structures for charts
        metrics.salesByCategory = {};
        metrics.weeklySales = 0;
        
        // Beautiful Simulated 7-day curve per node for the line chart (to match lovable UI)
        metrics.salesHistory = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: {
                HYD: [35, 45, 30, 60, 75, 40, 35],
                CHE: [20, 25, 40, 50, 45, 25, 20],
                BLR: [60, 70, 55, 95, 105, 50, 45]
            }
        };

        // Distributed queries to aggregate stock and sales
        for (let node of nodes) {
            if (!DOWN_NODES[node]) {
                metrics.activeNodes.push(node);
                const db = getDBConnection(node);
                
                const [sRow] = await db.execute('SELECT SUM(quantity) as stockSum FROM stock');
                metrics.totalInventoryStock += (sRow[0].stockSum || 0);
                
                // Revenue
                const [rRow] = await db.execute(`SELECT SUM(s.quantity * p.price) as revenue FROM sales s JOIN products p ON s.product_id = p.id`);
                metrics.totalRevenue += Number((rRow[0].revenue || 0));
                
                // Weekly Sales (Simplification of Last 7 Days)
                const [wRow] = await db.execute(`SELECT SUM(s.quantity * p.price) as weekly FROM sales s JOIN products p ON s.product_id = p.id WHERE s.date >= DATE_SUB(NOW(), INTERVAL 7 DAY)`);
                metrics.weeklySales += Number((wRow[0].weekly || 0));

                // Sales by Category
                const [catRow] = await db.execute(`
                    SELECT c.name, SUM(s.quantity * p.price) as catTotal 
                    FROM sales s JOIN products p ON s.product_id = p.id 
                    JOIN categories c ON p.category_id = c.id 
                    GROUP BY c.name
                `);
                
                catRow.forEach(row => {
                    metrics.salesByCategory[row.name] = (metrics.salesByCategory[row.name] || 0) + Number(row.catTotal);
                });
            }
        }
        
        res.json(metrics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
