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

// 停止服务器
async function stopServer() {
    if (confirm('确定要停止服务器吗？')) {
        try {
            const response = await fetch('/admin/stop-server', {
                method: 'POST'
            });
            const data = await response.json();
            alert(data.message);
        } catch (error) {
            alert('操作失败：' + error.message);
        }
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
                        <th>ID</th>
                        <th>名称</th>
                        <th>价格</th>
                        <th>库存</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.data.map(product => `
                        <tr>
                            <td>${product.id}</td>
                            <td>${product.name}</td>
                            <td>${product.price}</td>
                            <td>${product.stock}</td>
                            <td>
                                <button onclick="editProduct(${product.id})">编辑</button>
                                <button onclick="deleteProduct(${product.id})">删除</button>
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

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
}); 
