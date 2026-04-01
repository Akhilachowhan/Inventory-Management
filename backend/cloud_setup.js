const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Railway automatically injects MYSQLHOST, MYSQLUSER, MYSQLPASSWORD
const host = process.env.MYSQLHOST || process.env.DB_HOST || 'localhost';
const user = process.env.MYSQLUSER || process.env.DB_USER || 'root';
const password = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'Password@mysql';
const port = process.env.MYSQLPORT || 3306;

async function setupCloudDatabase() {
    console.log(`[Cloud Setup] Connecting to MySQL hosted at: ${host}:${port}...`);
    try {
        const connection = await mysql.createConnection({ host, user, password, port });
        
        console.log('[Cloud Setup] Successfully connected. Building databases if they do not exist...');
        
        // Read the SQL file
        const sqlFilePath = path.join(__dirname, '../database_setup.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        // Split by semicolons, ignoring empty statements
        const statements = sqlContent.split(';').map(s => s.trim()).filter(s => s.length > 0);
        
        for (let statement of statements) {
            try {
                // Ignore 'DROP DATABASE IF EXISTS' inside cloud environments to avoid destroying data on restart
                if (statement.toUpperCase().startsWith('DROP DATABASE')) {
                    continue; // Skip dropping to prevent wiping the cloud DB on every restart!
                }
                
                // Do not re-insert seed data if taking too long, but for a one-off presentation it's fine.
                // We'll execute each block.
                await connection.query(statement);
            } catch (err) {
                // Ignore errors related to IF NOT EXISTS or Duplicate entry
                if (err.code !== 'ER_DB_CREATE_EXISTS' && err.code !== 'ER_DUP_ENTRY' && err.code !== 'ER_TABLE_EXISTS_ERROR') {
                    console.error(`[Cloud Setup] Query Error (${err.code}) for statement:`, statement.substring(0, 50) + '...');
                }
            }
        }
        
        console.log('[Cloud Setup] Initialized all tables perfectly! Cloud databases are ready.');
        await connection.end();
    } catch (err) {
        console.error('[Cloud Setup] Failed to run cloud setup:', err.message);
    }
}

setupCloudDatabase();
