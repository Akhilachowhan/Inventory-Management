if (process.env.MYSQL_URL) {
    try {
        const url = new URL(process.env.MYSQL_URL);
        process.env.MYSQLHOST = url.hostname;
        process.env.MYSQLUSER = decodeURIComponent(url.username || 'root');
        process.env.MYSQLPASSWORD = decodeURIComponent(url.password || '');
        process.env.MYSQLPORT = url.port || '3306';
        console.log('[Env Inject] Successfully parsed MYSQL_URL into credentials. Host:', process.env.MYSQLHOST);
    } catch (e) {
        console.error('[Env Inject] Failed to parse MYSQL_URL', e);
    }
} else {
    process.env.MYSQLHOST = process.env.MYSQLHOST || process.env.DB_HOST || '';
    process.env.MYSQLUSER = process.env.MYSQLUSER || process.env.DB_USER || 'root';
    process.env.MYSQLPASSWORD = process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '';
    process.env.MYSQLPORT = process.env.MYSQLPORT || process.env.DB_PORT || '3306';
}
