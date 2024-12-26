// admin.js

// 统一的请求处理函数
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || '请求失败');
    }

    return data;
}

// 测试连接
async function testConnection() {
    try {
        const data = await fetchWithAuth('/admin/test-connection');
        alert(data.message);
    } catch (error) {
        alert('连接失败：' + error.message);
    }
}

// 加载库存列表
async function loadInventory() {
    try {
        const data = await fetchWithAuth('/inventory/list');
        const tbody = document.getElementById('inventoryList');
        tbody.innerHTML = '';
        
        data.inventory.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.current_stock || 0}</td>
                <td>${item.warning_value}</td>
                <td>${item.total_value || 0}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${item.id})">删除</button>
                    <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#operateModal" 
                            onclick="prepareOperation(${item.id}, '${item.name}')">操作</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('加载库存列表失败:', error);
    }
}

// 加载操作历史
async function loadOperationHistory() {
    try {
        const data = await fetchWithAuth('/inventory/history');
        const tbody = document.getElementById('operationList');
        tbody.innerHTML = '';
        
        data.history.forEach(record => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(record.timestamp).toLocaleString()}</td>
                <td>${record.item_name}</td>
                <td>${record.operation_type === 'in' ? '入库' : '出库'}</td>
                <td>${record.quantity}</td>
                <td>${record.operator}</td>
                <td>${record.remark || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('加载操作历史失败:', error);
    }
}

// 添加商品
async function addItem(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const itemData = {
            name: formData.get('itemName'),
            price: parseFloat(formData.get('itemPrice')),
            stock: parseInt(formData.get('itemStock')),
            warning_value: parseInt(formData.get('warningValue'))
        };

        const result = await fetchWithAuth('/inventory/add', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });

        alert('添加成功');
        e.target.reset();
        loadInventory();
    } catch (error) {
        console.error('添加失败:', error);
        alert('添加失败: ' + error.message);
    }
}

// 删除商品
async function deleteProduct(id) {
    if (!confirm('确定要删除这个商品吗？')) return;
    
    try {
        await fetchWithAuth(`/inventory/delete/${id}`, {
            method: 'DELETE'
        });
        alert('删除成功');
        loadInventory();
    } catch (error) {
        alert('删除失败：' + error.message);
    }
}

// 准备库存操作
function prepareOperation(itemId, itemName) {
    document.getElementById('operateItemId').value = itemId;
    document.getElementById('operateItemName').textContent = itemName;
}

// 执行库存操作
async function executeOperation(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const operationData = {
            item_id: parseInt(formData.get('itemId')),
            operation_type: formData.get('operationType'),
            quantity: parseInt(formData.get('quantity')),
            unit_price: parseFloat(formData.get('unitPrice')),
            remark: formData.get('remark')
        };

        await fetchWithAuth('/inventory/operate', {
            method: 'POST',
            body: JSON.stringify(operationData)
        });

        alert('操作成功');
        e.target.reset();
        bootstrap.Modal.getInstance(document.getElementById('operateModal')).hide();
        loadInventory();
        loadOperationHistory();
    } catch (error) {
        alert('操作失败：' + error.message);
    }
}

// 加载用户列表
async function loadUsers() {
    try {
        const data = await fetchWithAuth('/auth/users/list');
        const tbody = document.getElementById('usersList');
        tbody.innerHTML = '';
        
        data.users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.username}</td>
                <td>${user.role === 'admin' ? '管理员' : '普通用户'}</td>
                <td>${new Date(user.created_at).toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('加载用户列表失败:', error);
    }
}

// 添加用户
async function addUser(e) {
    e.preventDefault();
    
    try {
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value.trim();

        if (!username || !password) {
            alert('请填写用户名和密码');
            return;
        }

        await fetchWithAuth('/auth/users/add', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        alert('用户添加成功');
        document.getElementById('addUserForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
        loadUsers();
    } catch (error) {
        alert('添加用户失败: ' + error.message);
    }
}

// 修改密码
async function changePassword(e) {
    e.preventDefault();
    
    try {
        const oldPassword = document.getElementById('changeOldPassword').value;
        const newPassword = document.getElementById('changeNewPassword').value;
        const confirmPassword = document.getElementById('changeConfirmPassword').value;

        if (newPassword !== confirmPassword) {
            alert('两次输入的新密码不一致');
            return;
        }

        await fetchWithAuth('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword })
        });

        alert('密码修改成功，请重新登录');
        document.getElementById('changePasswordForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
        logout();
    } catch (error) {
        alert('修改密码失败: ' + error.message);
    }
}

// 退出登录
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// 导出数据为图片
async function exportToImage() {
    try {
        const timestamp = new Date().toLocaleString().replace(/[/]/g, '-');
        
        const exportDiv = document.createElement('div');
        exportDiv.style.position = 'absolute';
        exportDiv.style.left = '-9999px';
        exportDiv.style.background = 'white';
        exportDiv.style.padding = '20px';
        exportDiv.style.width = '800px';
        
        // 添加库存数据
        const inventorySection = document.createElement('div');
        inventorySection.innerHTML = '<h4 style="margin-bottom: 15px;">库存数据</h4>';
        const inventoryTable = document.querySelectorAll('.table')[0].cloneNode(true);
        
        // 移除操作列
        const rows = inventoryTable.querySelectorAll('tr');
        rows.forEach(row => {
            const lastCell = row.lastElementChild;
            if (lastCell) row.removeChild(lastCell);
        });
        inventorySection.appendChild(inventoryTable);
        exportDiv.appendChild(inventorySection);

        // 添加操作记录
        const historySection = document.createElement('div');
        historySection.style.marginTop = '30px';
        historySection.innerHTML = '<h4 style="margin-bottom: 15px;">操作记录</h4>';
        const historyTable = document.querySelectorAll('.table')[1].cloneNode(true);
        historySection.appendChild(historyTable);
        exportDiv.appendChild(historySection);
        
        document.body.appendChild(exportDiv);
        
        const canvas = await html2canvas(exportDiv, {
            scale: 2,
            backgroundColor: 'white',
            logging: false
        });
        
        document.body.removeChild(exportDiv);
        
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = `库存报表_${timestamp}.png`;
        link.href = image;
        link.click();
    } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败，请重试');
    }
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否有 token
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // 添加表单提交事件监听器
    const addItemForm = document.getElementById('addItemForm');
    if (addItemForm) {
        addItemForm.addEventListener('submit', addItem);
    }

    const operateForm = document.getElementById('operateForm');
    if (operateForm) {
        operateForm.addEventListener('submit', executeOperation);
    }

    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', addUser);
    }

    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', changePassword);
    }

    // 初始加载数据
    loadInventory();
    loadOperationHistory();
    loadUsers();

    // 定时刷新数据
    setInterval(() => {
        loadInventory();
        loadOperationHistory();
        loadUsers();
    }, 30000);
});
