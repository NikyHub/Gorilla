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
async function addItem() {
    try {
        const name = document.getElementById('itemName').value;
        const price = parseFloat(document.getElementById('itemPrice').value);
        const stock = parseInt(document.getElementById('itemStock').value);
        const warning_value = parseInt(document.getElementById('warningValue').value);

        // 验证输入
        if (!name || isNaN(price) || isNaN(stock) || isNaN(warning_value)) {
            alert('请填写所有必填字段，并确保数值正确');
            return;
        }

        const response = await fetch('/inventory/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
            // 清空输入框
            document.getElementById('itemName').value = '';
            document.getElementById('itemPrice').value = '';
            document.getElementById('itemStock').value = '';
            document.getElementById('warningValue').value = '';
            // 刷新商品列表
            loadProducts();
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

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});
