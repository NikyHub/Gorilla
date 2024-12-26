// config/database.js

const { Pool } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://czlgorilla:cfN9o8k3cWpqUgFhX2cRrSoHVPKTDAeA@dpg-ctm0s7jqf0us738b1qr0-a/gorilla_db';

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

// 初始化数据库
async function initDatabase() {
    try {
        // 测试连接是否正常
        const client = await pool.connect();
        console.log('成功连接到数据库:', DATABASE_URL);
        client.release();
        
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

        // 添加 warning_value 列（如果不存在）
        try {
            await pool.query(`
                ALTER TABLE items 
                ADD COLUMN IF NOT EXISTS warning_value INTEGER NOT NULL DEFAULT 0;
            `);
            console.log('warning_value 列已添加');
        } catch (error) {
            console.log('warning_value 列已存在或添加失败:', error.message);
        }

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
        
        // 创建 inventory 表
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                quantity INTEGER NOT NULL
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
