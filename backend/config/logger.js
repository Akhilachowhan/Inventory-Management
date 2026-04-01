const operationLogs = [
    {
        id: 'init-123456',
        action: 'SYSTEM_STARTUP',
        nodes: ['HYD', 'CHE', 'BLR'],
        message: 'Distributed Logging Service Initialized and ready to record syncs, replications, and node configs.',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'Success'
    }
];

function logOperation(action, nodes, message, status = 'Success') {
    const timestamp = new Date();
    // Format timestamp like 2024-03-20 12:01:00
    const formattedTime = timestamp.toISOString().replace('T', ' ').substring(0, 19);
    
    operationLogs.unshift({
        id: Date.now() + Math.random().toString(36).substring(7),
        action,
        nodes: Array.isArray(nodes) ? nodes : [nodes],
        message,
        timestamp: formattedTime,
        status
    });

    // Keep only last 100 logs
    if (operationLogs.length > 100) {
        operationLogs.pop();
    }
}

module.exports = { operationLogs, logOperation };
