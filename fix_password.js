const { getDBConnection } = require('./backend/config/db_utils');

async function fixPassword() {
    const hash = '$2b$10$UUt78wU07I46H0JON/gbBOtDu0l4QInQfQy6t6lLkP2qNX.sm2PV.';
    console.log('Setting password to:', hash);
    for(let n of ['HYD', 'CHE', 'BLR']) {
        try {
            await getDBConnection(n).execute('UPDATE users SET password = ? WHERE username = ?', [hash, 'admin']);
            console.log(n + ' updated successfully');
        } catch(e) {
            console.error(e);
        }
    }
    process.exit(0);
}
fixPassword();
