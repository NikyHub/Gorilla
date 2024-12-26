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
// 获取用户列表（仅管理员可用）
router.get('/users/list', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '无权限执行此操作'
            });
        }

        const db = getDatabase();
        // 使用 datetime('now', 'localtime') 格式化时间
        const users = await db.all(`
            SELECT 
                username, 
                role, 
                datetime(created_at, 'localtime') as created_at 
            FROM users
        `);

        res.json({
            success: true,
            users
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
        const db = getDatabase();

        // 验证旧密码
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user || user.password !== oldPassword) {
            return res.status(400).json({
                success: false,
                message: '原密码错误'
            });
        }

        // 更新密码
        await db.run('UPDATE users SET password = ? WHERE username = ?', [newPassword, username]);

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

module.exports = router; // 确保正确导出 router
