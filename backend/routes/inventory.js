const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');

// 测试路由
router.get('/test', (req, res) => {
    res.json({ success: true, message: '连接成功' });
});

// 获取库存列表
router.get('/list', async (req, res) => {
    try {
        const db = getDatabase();
        const inventory = await db.all(`
            SELECT 
                items.*,
                COALESCE(SUM(CASE WHEN operation_type = 'in' THEN quantity ELSE -quantity END), 0) as current_stock,
                COALESCE(SUM(CASE WHEN operation_type = 'in' THEN quantity * unit_price ELSE 0 END), 0) as total_value
            FROM items
            LEFT JOIN operation_history ON items.id = operation_history.item_id
            GROUP BY items.id
        `);

        res.json({
            success: true,
            inventory: inventory
        });
    } catch (error) {
        console.error('获取库存列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取库存列表失败'
        });
    }
});

// 获取操作历史
router.get('/history', async (req, res) => {
    try {
        const db = getDatabase();
        const history = await db.all(`
            SELECT 
                operation_history.*,
                items.name as item_name
            FROM operation_history
            LEFT JOIN items ON operation_history.item_id = items.id
            ORDER BY operation_history.timestamp DESC
            LIMIT 100
        `);

        res.json({
            success: true,
            history: history
        });
    } catch (error) {
        console.error('获取操作历史失败:', error);
        res.status(500).json({
            success: false,
            message: '获取操作历史失败'
        });
    }
});

// 添加商品
router.post('/add', async (req, res) => {
    try {
        const { id, name, warning_value } = req.body;
        const db = getDatabase();

        await db.run(`
            INSERT INTO items (id, name, warning_value)
            VALUES (?, ?, ?)
        `, [id, name, warning_value]);

        res.json({
            success: true,
            message: '商品添加成功'
        });
    } catch (error) {
        console.error('添加商品失败:', error);
        res.status(500).json({
            success: false,
            message: '添加商品失败'
        });
    }
});

// 删除商品
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDatabase();

        await db.run('DELETE FROM items WHERE id = ?', [id]);
        await db.run('DELETE FROM operation_history WHERE item_id = ?', [id]);

        res.json({
            success: true,
            message: '商品删除成功'
        });
    } catch (error) {
        console.error('删除商品失败:', error);
        res.status(500).json({
            success: false,
            message: '删除商品失败'
        });
    }
});

// 操作库存
router.post('/operate', async (req, res) => {
    try {
        const { item_id, operation_type, quantity, unit_price, remark } = req.body;
        const operator = req.user.username;
        const db = getDatabase();

        // 检查库存是否足够（出库操作时）
        if (operation_type === 'out') {
            const currentStock = await db.get(`
                SELECT COALESCE(SUM(CASE WHEN operation_type = 'in' THEN quantity ELSE -quantity END), 0) as stock
                FROM operation_history
                WHERE item_id = ?
            `, [item_id]);

            if (currentStock.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: '库存不足'
                });
            }
        }

        // 使用当前时间戳
        const now = new Date().toISOString();

        await db.run(`
            INSERT INTO operation_history (item_id, operation_type, quantity, unit_price, operator, remark, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        `, [item_id, operation_type, quantity, unit_price, operator, remark]);

        res.json({
            success: true,
            message: '操作成功'
        });
    } catch (error) {
        console.error('操作失败:', error);
        res.status(500).json({
            success: false,
            message: '操作失败'
        });
    }
});

module.exports = router; 