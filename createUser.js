const fs = require('fs');
const path = require('path');

// 定义用户数据文件路径
const USER_DB_PATH = path.join(__dirname, 'users.json');

// 从命令行获取参数
const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
    console.log('使用方法: node createUser.js <用户名> <密码>');
    process.exit(1);
}

// 确保用户数据文件存在
function initializeUserDB() {
    if (!fs.existsSync(USER_DB_PATH)) {
        fs.writeFileSync(USER_DB_PATH, JSON.stringify([], null, 2));
    }
}

// 创建用户
function createUser(username, password) {
    try {
        initializeUserDB();
        
        // 读取现有用户数据
        const users = JSON.parse(fs.readFileSync(USER_DB_PATH, 'utf8'));
        
        // 检查用户名是否已存在
        if (users.some(user => user.username === username)) {
            console.error('用户名已存在!');
            return false;
        }
        
        // 添加新用户
        users.push({
            username,
            password,
            role: 'user',
            createdAt: new Date().toISOString()
        });
        
        // 保存更新后的用户数据
        fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2));
        return true;
    } catch (err) {
        console.error('创建用户时发生错误:', err);
        return false;
    }
}

// 执行创建用户操作
if (createUser(username, password)) {
    console.log('用户创建成功!');
} else {
    console.log('用户创建失败!');
} 