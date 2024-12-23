// 登录函数
async function login(username, password, role) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, role })
        });

        const data = await response.json();
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return true;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('登录失败:', error);
        throw error;
    }
}

// 登出函数
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// 检查登录状态
async function checkAuthStatus() {
    try {
        const response = await fetchWithAuth('/api/auth/status');
        const data = await response.json();
        return data.isLoggedIn;
    } catch (error) {
        console.error('检查登��状态失败:', error);
        return false;
    }
}

// 获取当前用户信息
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// 创建新文件 auth.js 用于共享验证逻辑
async function validateToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        return false;
    }

    try {
        const response = await fetch('/auth/validate', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            localStorage.clear();
            return false;
        }

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Token验证失败:', error);
        localStorage.clear();
        return false;
    }
} 