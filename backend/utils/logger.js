const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../../logs');
if (!fs.existsSync(logFilePath)) {
    fs.mkdirSync(logFilePath, { recursive: true });
}

function logOperation(operation, details, error = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${error ? 'ERROR' : 'INFO'}] ${operation} - ${JSON.stringify(details)}\n`;
    
    fs.appendFileSync(path.join(logFilePath, 'app.log'), logEntry, 'utf8');
    
    if (error) {
        fs.appendFileSync(path.join(logFilePath, 'error.log'), `${logEntry} Stack trace: ${error.stack}\n`, 'utf8');
    }
}

module.exports = { logOperation };
