const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
let db = null;

async function initDatabase() {
    try {
        db = await open({
            filename: './database.sqlite',
            driver: sqlite3.Database
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                warning_value INTEGER NOT NULL DEFAULT 0
            )
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS operation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id TEXT NOT NULL,
                operation_type TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price REAL,
                operator TEXT NOT NULL,
                remark TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (item_id) REFERENCES items (id)
            )
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const adminExists = await db.get('SELECT 1 FROM users WHERE username = ?', ['admin']);
        if (!adminExists) {
            await db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
                ['admin', 'admin123', 'admin']);
            await db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
                ['user', 'user123', 'user']);
        }

        console.log('数据库初始化成功');
        return db;
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    }
}

function getDatabase() {
    if (!db) {
        throw new Error('数据库未初始化');
    }
    return db;
}

module.exports = {
    initDatabase,
    getDatabase
}; 