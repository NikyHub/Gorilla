// routes/inventory.js

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// 测试路由
router.get('/test', verifyToken, (req, res) => {
    res.json({ success: true, message: '连接成功' });
});

// 获取库存列表
router.get('/list', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
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
            inventory: result.rows
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
router.get('/history', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
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
            history: result.rows
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
router.post('/add', verifyToken, async (req, res) => {
    try {
        const { name, price, stock, warning_value } = req.body;

        // 验证必填字段
        if (!name || price === undefined || stock === undefined || warning_value === undefined) {
            return res.status(400).json({
                success: false,
                message: '请填写所有必填字段（名称、价格、库存、预警值）'
            });
        }

        // 确保数值类型正确
        const numericPrice = parseFloat(price);
        const numericStock = parseInt(stock);
        const numericWarningValue = parseInt(warning_value);

        // 验证数值有效性
        if (isNaN(numericPrice) || isNaN(numericStock) || isNaN(numericWarningValue)) {
            return res.status(400).json({
                success: false,
                message: '价格、库存和预警值必须是有效的数字'
            });
        }

        const result = await pool.query(`
            INSERT INTO items (name, price, stock, warning_value)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [name, numericPrice, numericStock, numericWarningValue]);

        res.json({
            success: true,
            message: '商品添加成功',
            item: result.rows[0]
        });
    } catch (error) {
        console.error('添加商品失败:', error);
        res.status(500).json({
            success: false,
            message: '添加商品失败: ' + error.message
        });
    }
});


// 删除商品路由

router.delete('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 开启事务
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // 1. 首先删除该商品的所有操作历史
            await client.query(
                'DELETE FROM operation_history WHERE item_id = $1',
                [id]
            );
            
            // 2. 然后删除商品
            const result = await client.query(
                'DELETE FROM items WHERE id = $1 RETURNING *',
                [id]
            );

            if (result.rowCount === 0) {
                throw new Error('商品不存在');
            }

            await client.query('COMMIT');
            
            res.json({ 
                success: true,
                message: '商品删除成功'
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('删除商品失败:', error);
        res.status(500).json({
            success: false,
            message: '删除商品失败: ' + error.message
        });
    }
});

// 操作库存
router.post('/operate', verifyToken, async (req, res) => {
    try {
        const { item_id, operation_type, quantity, unit_price, remark } = req.body;
        const operator = req.user.username;

        // 检查库存是否足够（出库操作时）
        if (operation_type === 'out') {
            const currentStockResult = await pool.query(`
                SELECT COALESCE(SUM(CASE WHEN operation_type = 'in' THEN quantity ELSE -quantity END), 0) as stock
                FROM operation_history
                WHERE item_id = $1
            `, [item_id]);

            if (currentStockResult.rows[0].stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: '库存不足'
                });
            }
        }

        // 使用当前时间戳
        await pool.query(`
            INSERT INTO operation_history (item_id, operation_type, quantity, unit_price, operator, remark, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
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
