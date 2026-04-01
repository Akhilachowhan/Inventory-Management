const { getDBConnection } = require('./backend/config/db_utils');

async function fixDatabases() {
    const nodes = ['HYD', 'CHE', 'BLR'];
    for (const node of nodes) {
        try {
            const db = getDBConnection(node);
            
            // Check if supplier_id already exists to prevent errors
            const [columns] = await db.query(`SHOW COLUMNS FROM purchases LIKE 'supplier_id'`);
            
            if (columns.length === 0) {
                console.log(`[${node}] Adding supplier_id to purchases...`);
                await db.query(`ALTER TABLE purchases ADD COLUMN supplier_id INT DEFAULT NULL`);
                await db.query(`ALTER TABLE purchases ADD CONSTRAINT fk_purchases_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL`);
                console.log(`[${node}] Update successful.`);
            } else {
                console.log(`[${node}] supplier_id already exists.`);
            }
        } catch (err) {
            console.error(`[${node}] Error updating:`, err.message);
        }
    }
    process.exit(0);
}

fixDatabases();
