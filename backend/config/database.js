// config/database.js

const { Pool } = require('pg'); // 引入 pg 模块
require('dotenv').config(); // 加载环境变量

// 从环境变量读取数据库连接字符串
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://czlgorilla:cfN9o8k3cWpqUgFhX2cRrSoHVPKTDAeA@dpg-ctm0s7jqf0us738b1qr0-a/gorilla_db';

// 创建一个数据库连接池
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Render 上的 PostgreSQL 默认需要 SSL
    },
});

// 初始化数据库
async function initDatabase() {
    try {
        // 测试连接是否正常
        const client = await pool.connect();
        console.log('成功连接到数据库:', DATABASE_URL);
        client.release(); // 释放连接

        // 示例：创建表（你可以根据需要修改表结构）
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                quantity INTEGER NOT NULL
            );
        `);

        console.log('数据库表已初始化');
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error; // 抛出错误，以便在 server.js 中捕获
    }
}

// 导出数据库操作模块
module.exports = {
    initDatabase,
    pool,
};
