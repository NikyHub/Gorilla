// routes/auth.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const SECRET_KEY = 'your-secret-key';

// 登录路由
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        
        if (user && user.password === password) {
            const token = jwt.sign({ username, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
            res.json({
                success: true,
                token,
                username,
                role: user.role
            });
        } else {
            res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({
            success: false,
            message: '登录失败'
        });
    }
});

module.exports = router; // 确保正确导出 router
