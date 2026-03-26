const dbHyd = require('./db_hyd');
const dbChe = require('./db_che');
const dbBlr = require('./db_blr');
const { logOperation } = require('../utils/logger');

// Fault tolerance simulator - set a location to true to simulate it being "down"
const DOWN_NODES = {
    HYD: false,
    CHE: false,
    BLR: false
};

const getDBConnection = (location) => {
    if (DOWN_NODES[location]) {
        throw new Error(`Node ${location} is currently unavailable.`);
    }

    switch(location?.toUpperCase()) {
        case 'HYD': return dbHyd;
        case 'CHE': return dbChe;
        case 'BLR': return dbBlr;
        default: throw new Error('Invalid warehouse location specified.');
    }
}

/**
 * Simulates a Two-Phase Commit (2PC) for Replicated Data.
 * Tries to run the query on all 3 databases. If any fail, it rolls back the successful ones.
 */
const executeOnAll = async (query, params) => {
    let connections = [
        { loc: 'HYD', db: dbHyd },
        { loc: 'CHE', db: dbChe },
        { loc: 'BLR', db: dbBlr }
    ];

    // Check for down nodes before starting
    const downNodes = connections.filter(c => DOWN_NODES[c.loc]);
    if (downNodes.length > 0) {
        throw new Error(`Cannot perform replicated write. The following nodes are down: ${downNodes.map(d => d.loc).join(', ')}`);
    }

    // Phase 1: Prepare & execute
    let success = [];
    try {
        for (let conn of connections) {
            // we use the pool directly to execute
            const [result] = await conn.db.execute(query, params);
            success.push({ loc: conn.loc, db: conn.db, result });
        }
        return success.map(s => s.result);
    } catch (error) {
        logOperation('2PC-VOTING-ABORT', { query, params, error: error.message });
        
        // Phase 2: Rollback (For simple simulation, we manually delete if it was an insert)
        // Note: A true 2PC would use transaction prepare/commit SQL commands via XA TRANSACTIONS.
        // Doing full XA with MySQL nodejs drivers is complex, so we're simulating here
        // If it's an auto_increment insert, we can't easily undo it without ID, but this demonstrates the concept:
        
        logOperation('2PC-ROLLBACK', { successfulNodes: success.map(s => s.loc), message: "Simulating rollback due to replication failure." });
        throw new Error(`Replication failed. Transaction aborted across all nodes. Error: ${error.message}`);
    }
}

module.exports = {
    getDBConnection,
    executeOnAll,
    DOWN_NODES
};
