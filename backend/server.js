// server.js

const express = require('express');
const path = require('path');
const { initDatabase } = require('./config/database');
const authRouter = require('./routes/auth');
const inventoryRouter = require('./routes/inventory'); // 导入 inventory 路由

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/login.html');
});

initDatabase()
    .then(() => {
        console.log('数据库初始化成功');

        app.use('/auth', authRouter);
        app.use('/inventory', inventoryRouter); // 使用 inventory 路由

        const PORT = process.env.PORT || 3002;
        app.listen(PORT, () => {
            console.log('\n服务器启动成功！');
            console.log('-------------------');
            console.log(`访问地址: http://localhost:${PORT}`);
            console.log('\n登录信息:');
            console.log('管理员 - 用户名: admin  密码: admin123');
            console.log('用户 - 用户名: user   密码: user123');
            console.log('-------------------\n');
        });
    })
    .catch((error) => {
        console.error('服务器启动失败:', error);
        process.exit(1);
    });
