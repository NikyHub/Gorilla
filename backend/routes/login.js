const express = require('express');
const router = express.Router();

router.post('/api/auth/login', async (req, res) => {
    const { username, password, role } = req.body;
    console.log('====================');
    console.log('[DEBUG] 收到登录请求:', {
        username: username,
        password: password,
        role: role
    });
    
    try {
        // 管理员登录逻辑
        if (role === 'admin') {
            const db = getDatabase();
            const user = await db.get(
                'SELECT * FROM users WHERE username = ? AND role = ?', 
                [username, role]
            );

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.json({ 
                    success: false, 
                    message: '管理员用户名或密码错误' 
                });
            }

            // 设置管理员 session
            req.session.userId = user.id;
            req.session.role = 'admin';
            
            return res.json({ 
                success: true,
                user: {
                    username: user.username,
                    role: 'admin'
                }
            });
        }
        
        // 普通用户登录逻辑
        const USER_DB_PATH = path.join(__dirname, '../users.json');
        console.log('[DEBUG] 用户文件路径:', USER_DB_PATH);
        
        const fileContent = fs.readFileSync(USER_DB_PATH, 'utf8');
        console.log('[DEBUG] 原始文件内容:', fileContent);
        
        const users = JSON.parse(fileContent);
        console.log('[DEBUG] 所有用户:', users);

        const user = users.find(u => {
            const usernameMatch = String(u.username) === String(username);
            const passwordMatch = String(u.password) === String(password);
            
            console.log('[DEBUG] 比对结果:', {
                storedUser: {
                    username: u.username,
                    password: u.password
                },
                receivedUser: {
                    username: username,
                    password: password
                },
                matches: {
                    username: usernameMatch,
                    password: passwordMatch
                }
            });
            
            return usernameMatch && passwordMatch;
        });

        if (user) {
            console.log('[DEBUG] 找到匹配用户');
            // 设置普通用户 session
            req.session.userId = username;
            req.session.role = 'user';
            
            return res.json({
                success: true,
                user: {
                    username: username,
                    role: 'user'
                }
            });
        } else {
            console.log('[DEBUG] 未找到匹配用户');
            return res.json({
                success: false,
                message: '用户名或密码错误'
            });
        }
    } catch (err) {
        console.error('[ERROR] 验证错误:', err);
        return res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 添加状态检查路由
router.get('/api/auth/status', (req, res) => {
    console.log('[DEBUG] 检查登录状态:', req.session);
    
    if (req.session && req.session.userId) {
        res.json({
            isLoggedIn: true,
            user: {
                username: req.session.userId,
                role: req.session.role
            }
        });
    } else {
        res.json({
            isLoggedIn: false
        });
    }
});

// 添加登出路由
router.post('/api/auth/logout', (req, res) => {
    console.log('[DEBUG] 用户登出');
    req.session.destroy((err) => {
        if (err) {
            console.error('[ERROR] 登出错误:', err);
            return res.json({
                success: false,
                message: '登出失败'
            });
        }
        res.json({
            success: true,
            message: '登出成功'
        });
    });
});

module.exports = router;
