const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    // 如果是登录页面或登录请求，允许访问
    if (req.path === '/login.html' || req.path === '/auth/login' || req.path === '/auth/register') {
        return next();
    }

    // 检查是否是HTML页面请求
    if (req.path.endsWith('.html')) {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.redirect('/login.html');
        }
    }

    next();
}

const verifyToken = (req, res, next) => {
    try {
        // 从请求头获取 token
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }

        // 验证 token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // 将解码后的用户信息添加到请求对象
        req.user = decoded;

        // 检查 token 是否过期
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            return res.status(401).json({
                success: false,
                message: '认证令牌已过期'
            });
        }
        
        next();
    } catch (error) {
        console.error('Token验证失败:', error);
        return res.status(401).json({
            success: false,
            message: '无效的认证令牌'
        });
    }
};

module.exports = { requireAuth, verifyToken };