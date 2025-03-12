import fs from 'fs/promises';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, password, role } = req.body || {};
    console.log('[DEBUG] 收到登录请求:', { username, password, role });

    try {
        // 管理员登录逻辑（硬编码示例）
        if (role === 'admin') {
            if (username === 'admin' && password === 'admin123') {
                const token = jwt.sign(
                    { username, role: 'admin' },
                    process.env.JWT_SECRET || 'your-secret-key', // 建议使用环境变量
                    { expiresIn: '1h' }
                );
                return res.status(200).json({
                    success: true,
                    token,
                    user: { username: 'admin', role: 'admin' }
                });
            } else {
                return res.status(401).json({ success: false, message: '管理员用户名或密码错误' });
            }
        }

        // 普通用户登录逻辑（从 users.json 文件读取）
        const USER_DB_PATH = './users.json'; // 相对路径，Vercel 需确保文件存在
        let users = [];
        try {
            const fileContent = await fs.readFile(USER_DB_PATH, 'utf8');
            users = JSON.parse(fileContent);
        } catch (err) {
            console.error('[ERROR] 读取 users.json 失败:', err);
            return res.status(500).json({ success: false, message: '服务器错误：无法加载用户数据' });
        }

        const user = users.find(u => 
            String(u.username) === String(username) && 
            String(u.password) === String(password)
        );

        if (user) {
            const token = jwt.sign(
                { username, role: 'user' },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1h' }
            );
            return res.status(200).json({
                success: true,
                token,
                user: { username, role: 'user' }
            });
        } else {
            return res.status(401).json({ success: false, message: '用户名或密码错误' });
        }
    } catch (err) {
        console.error('[ERROR] 登录错误:', err);
        return res.status(500).json({ success: false, message: '服务器错误' });
    }
}
