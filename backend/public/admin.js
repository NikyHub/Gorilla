// admin.js

// 测试连接
async function testConnection() {
    try {
        const response = await fetch('/admin/test-connection');
        const data = await response.json();
        alert(data.message);
    } catch (error) {
        alert('连接失败：' + error.message);
    }
}

// 加载商品列表
async function loadProducts() {
    try {
        const response = await fetch('/inventory/list');
        const data = await response.json();
        const productList = document.getElementById('productList');
        
        productList.innerHTML = `
            <h2>商品列表</h2>
            <table>
                <thead>
                    <tr>
                        <th>商品编号</th>
                        <th>商品名称</th>
                        <th>价格</th>
                        <th>当前库存</th>
                        <th>库存预警值</th>
                        <th>入库总额</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.inventory.map(item => `
                        <tr>
                            <td>${item.id}</td>
                            <td>${item.name}</td>
                            <td>${item.price}</td>
                            <td>${item.current_stock || 0}</td>
                            <td>${item.warning_value}</td>
                            <td>${item.total_value || 0}</td>
                            <td>
                                <button onclick="deleteProduct(${item.id})">删除</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        alert('加载商品列表失败：' + error.message);
    }
}

 // 添加商品
async function addItem(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const name = formData.get('itemName');
        const price = parseFloat(formData.get('itemPrice'));
        const stock = parseInt(formData.get('itemStock'));
        const warning_value = parseInt(formData.get('warningValue'));

        const token = localStorage.getItem('token');
        const response = await fetch('/inventory/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                price,
                stock,
                warning_value
            })
        });

        const result = await response.json();
        if (result.success) {
            alert('添加成功');
            e.target.reset();
            loadInventory();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('添加失败:', error);
        alert('添加失败: ' + error.message);
    }
}

// 删除商品
async function deleteProduct(id) {
    if (confirm('确定要删除这个商品吗？')) {
        try {
            const response = await fetch(`/inventory/delete/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                alert('删除成功');
                loadProducts(); // 刷新列表
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            alert('删除失败：' + error.message);
        }
    }
}
// 添加用户
async function addUser(e) {
    if (e) e.preventDefault();
    
    try {
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value.trim();

        if (!username || !password) {
            alert('请填写用户名和密码');
            return;
        }

        const token = localStorage.getItem('token');
        const response = await fetch('/auth/users/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();
        if (data.success) {
            alert('用户添加成功');
            document.getElementById('addUserForm').reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            if (modal) modal.hide();
            loadUsers();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('添加用户失败:', error);
        alert('添加用户失败: ' + error.message);
    }
}
  // 页面加载完成后的初始化
    document.addEventListener('DOMContentLoaded', () => {
        // 添加商品表单提交事件
        const addItemForm = document.getElementById('addItemForm');
        if (addItemForm) {
            addItemForm.addEventListener('submit', addItem);
        }

        // 初始加载数据
        loadInventory();
        loadOperationHistory();
        loadUsers();

        // 定时刷新
        setInterval(() => {
            loadInventory();
            loadOperationHistory();
            loadUsers();
        }, 30000);
    });
