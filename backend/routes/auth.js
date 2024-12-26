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
// routes/auth.js

// 添加用户（仅管理员可用）
router.post('/users/add', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '无权限执行此操作'
            });
        }

        const { username, password } = req.body;
        
        // 检查用户名是否已存在
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 添加新用户
        await pool.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
            [username, password, 'user']
        );

        res.json({
            success: true,
            message: '用户添加成功'
        });
    } catch (error) {
        console.error('添加用户失败:', error);
        res.status(500).json({
            success: false,
            message: '添加用户失败'
        });
    }
});

// 获取用户列表（仅管理员可用）
router.get('/users/list', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '无权限执行此操作'
            });
        }

        const result = await pool.query('SELECT username, role, created_at FROM users');
        res.json({
            success: true,
            users: result.rows
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户列表失败'
        });
    }
});

// 修改密码
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const username = req.user.username;

        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user || user.password !== oldPassword) {
            return res.status(400).json({
                success: false,
                message: '原密码错误'
            });
        }

        await pool.query('UPDATE users SET password = $1 WHERE username = $2', [newPassword, username]);

        res.json({
            success: true,
            message: '密码修改成功'
        });
    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({
            success: false,
            message: '修改密码失败'
        });
    }
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '未提供认证令牌'
        });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: '认证令牌无效'
            });
        }
        req.user = user;
        next();
    });
}

module.exports = router;
