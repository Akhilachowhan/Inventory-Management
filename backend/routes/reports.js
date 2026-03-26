const express = require('express');
const router = express.Router();
const { getDBConnection, DOWN_NODES } = require('../config/db_utils');
const { verifyToken } = require('./auth');

router.use(verifyToken);

router.get('/analytics', async (req, res) => {
    let report = {
        totalRevenue: 0,
        totalProcurement: 0,
        grossProfit: 0,
        activeNodes: [],
        monthlyTrend: {
            labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
            datasets: { HYD: [], CHE: [], BLR: [] }
        },
        salesVsPurchases: {
            labels: ['HYD', 'CHE', 'BLR'],
            sales: [0, 0, 0],
            purchases: [0, 0, 0]
        },
        salesByCategory: {},
        topTransactions: [
            { id: 1, node: 'BLR', client: 'SiliconValley IT', item: 'Laptop Dell XPS 15', amount: 1020000 },
            { id: 2, node: 'CHE', client: 'Chennai Digital', item: 'Smartphone Samsung S23', amount: 680000 },
            { id: 3, node: 'HYD', client: 'Hyderabad Electronics', item: 'Sony Alpha Camera', amount: 450000 }
        ]
    };

    const nodes = ['HYD', 'CHE', 'BLR'];
    
    try {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (!DOWN_NODES[node]) {
                report.activeNodes.push(node);
                const db = getDBConnection(node);
                
                // Real Revenue
                const [sRow] = await db.execute(`SELECT SUM(s.quantity * p.price) as totalSales FROM sales s JOIN products p ON s.product_id = p.id`);
                const nodeSales = Number(sRow[0].totalSales || 0);
                report.totalRevenue += nodeSales;
                report.salesVsPurchases.sales[i] = nodeSales;

                // Real Procurement
                const [pRow] = await db.execute(`SELECT SUM(pu.quantity * p.price) as totalPurchases FROM purchases pu JOIN products p ON pu.product_id = p.id`);
                const nodePurchases = Number(pRow[0].totalPurchases || 0);
                report.totalProcurement += nodePurchases;
                report.salesVsPurchases.purchases[i] = nodePurchases;
                
                // Real Sales by Category
                const [catRow] = await db.execute(`
                    SELECT c.name, SUM(s.quantity * p.price) as catTotal 
                    FROM sales s JOIN products p ON s.product_id = p.id 
                    JOIN categories c ON p.category_id = c.id 
                    GROUP BY c.name
                `);
                
                catRow.forEach(row => {
                    report.salesByCategory[row.name] = (report.salesByCategory[row.name] || 0) + Number(row.catTotal);
                });
                
                // Monthly trend - mock but scale relative to real sales structure for UX
                const base = nodeSales > 0 ? (nodeSales / Number(6)) : (Math.random() * 500000 + 200000);
                report.monthlyTrend.datasets[node] = [
                    base * 0.8, base * 0.9, base * 1.1, base * 1.0, base * 1.2, base * 1.3
                ];
            } else {
                report.monthlyTrend.datasets[node] = [0, 0, 0, 0, 0, 0];
            }
        }
        
        report.grossProfit = report.totalRevenue - report.totalProcurement;
        
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
