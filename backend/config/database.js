// config/database.js

const { Pool } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function initDatabase() {
    try {
        const client = await pool.connect();
        console.log('成功连接到数据库:', DATABASE_URL);
        client.release();

        // 临时删除 items 表
        await dropTable();

        // 创建 users 表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                username VARCHAR(255) PRIMARY KEY,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 创建 items 表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price NUMERIC NOT NULL,
                stock INTEGER NOT NULL,
                warning_value INTEGER NOT NULL
            );
        `);

        // 创建 operation_history 表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS operation_history (
                id SERIAL PRIMARY KEY,
                item_id INTEGER REFERENCES items(id),
                operation_type VARCHAR(50) NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price NUMERIC NOT NULL,
                operator VARCHAR(255) NOT NULL,
                remark TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            INSERT INTO users (username, password, role)
            VALUES ('admin', 'admin123', 'admin')
            ON CONFLICT (username) DO NOTHING;
        `);

        console.log('数据库表已初始化');
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    }
}

module.exports = {
    initDatabase,
    pool,
};
