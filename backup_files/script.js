const API_URL = 'http://localhost:3001/api/inventory';
let currentProducts = [];

// 加载库存列表
async function loadInventory() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/list`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            // token 过期或无效
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('[DEBUG] 获取到的商品数据:', products);
        
        currentProducts = products;
        displayInventory(products);
    } catch (error) {
        console.error('加载库存失败:', error);
        alert('加载库存失败: ' + error.message);
    }
}

// 显示库存列表
function displayInventory(products, highlightText = '') {
    const tbody = document.getElementById('inventoryBody');
    tbody.innerHTML = '';
    
    if (!Array.isArray(products) || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">暂无库存数据</td></tr>';
        return;
    }
    
    products.forEach((product, index) => {
        const status = product.quantity <= product.alert_quantity ? '库存不足' : '正常';
        const statusClass = product.quantity <= product.alert_quantity ? 'warning' : 'normal';
        
        // 如果有搜索文本，给匹配的文本添加高亮
        let displayName = product.name;
        if (highlightText) {
            const regex = new RegExp(`(${highlightText})`, 'gi');
            displayName = product.name.replace(regex, '<span class="highlight">$1</span>');
        }
        
        // 第一个匹配项添加特殊样式
        const rowClass = index === 0 && highlightText ? 'search-result-top' : '';
        
        tbody.innerHTML += `
            <tr class="${rowClass}">
                <td>${product.id}</td>
                <td>${displayName}</td>
                <td>${product.quantity}</td>
                <td>${product.alert_quantity}</td>
                <td class="${statusClass}">${status}</td>
                <td>
                    <button onclick="showModal('入库', ${product.id})" class="btn-small btn-primary">入库</button>
                    <button onclick="showModal('出库', ${product.id})" class="btn-small btn-warning">出库</button>
                </td>
            </tr>
        `;
    });
}

// 搜索商品
function searchProducts() {
    const searchText = document.getElementById('searchInput').value.trim().toLowerCase();
    
    if (!searchText) {
        displayInventory(currentProducts);
        return;
    }

    console.log('[DEBUG] 搜索商品:', searchText);
    
    const filteredProducts = currentProducts.filter(product => 
        product.name.toLowerCase().includes(searchText)
    );
    
    if (filteredProducts.length === 0) {
        // 没���找到匹配的商品
        const tbody = document.getElementById('inventoryBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    未找到包含 "${searchText}" 的商品
                </td>
            </tr>
        `;
        return;
    }
    
    // 对搜索结果进行排序：完全匹配的排在前面
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        const aExactMatch = a.name.toLowerCase() === searchText;
        const bExactMatch = b.name.toLowerCase() === searchText;
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        return 0;
    });

    // 修改显示函数以支持高亮
    displayInventory(sortedProducts, searchText);
}

// 显示模态框
function showModal(type, productId = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('inventoryForm');
    const productNameInput = document.getElementById('productName');
    
    modalTitle.textContent = type;
    modal.setAttribute('data-type', type);
    modal.setAttribute('data-product-id', productId);
    
    if (productId) {
        const product = currentProducts.find(p => p.id === productId);
        if (product) {
            productNameInput.value = product.name;
            productNameInput.disabled = true;
        }
    } else {
        productNameInput.value = '';
        productNameInput.disabled = false;
    }
    
    modal.style.display = 'block';
}

// 关闭模态框
function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    document.getElementById('inventoryForm').reset();
}

// 处理入库/出库提交
async function handleInventorySubmit(event) {
    event.preventDefault();
    
    const modal = document.getElementById('modal');
    const type = modal.getAttribute('data-type');
    const productId = modal.getAttribute('data-product-id');
    const quantity = parseInt(document.getElementById('quantity').value);
    
    try {
        const product = currentProducts.find(p => p.id === parseInt(productId));
        if (!product) {
            throw new Error('商品不存在');
        }

        // 检查出库数量是否合法
        if (type === '出库' && quantity > product.quantity) {
            throw new Error('出库数量不能大于当前库存');
        }

        const newQuantity = type === '入库' ? 
            product.quantity + quantity : 
            product.quantity - quantity;

        console.log('[DEBUG] 更新库存:', {
            id: productId,
            oldQuantity: product.quantity,
            change: quantity,
            newQuantity: newQuantity,
            type: type
        });

        const response = await fetch(`${API_URL}/update/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: product.name,
                quantity: newQuantity,
                alert_quantity: product.alert_quantity,
                price: product.price
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `作失败 (${response.status})`);
        }

        await loadInventory();
        closeModal();
        alert(`${type}操作成功！`);
    } catch (error) {
        console.error(`${type}失败:`, error);
        alert(`${type}失败: ` + error.message);
    }
}

// 显示库存查询
function showInventory() {
    loadInventory();
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    console.log('[DEBUG] 页面加载完成，开始加载库存数据...');
    loadInventory();
});

// 添加样式
const style = document.createElement('style');
style.textContent = `
    .highlight {
        background-color: #fff3cd;
        padding: 2px;
        border-radius: 2px;
    }
    
    .search-result-top {
        background-color: #f8f9fa;
        border-left: 3px solid #007bff;
    }
    
    #searchInput {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 200px;
        margin-right: 10px;
    }
    
    #searchInput:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0,123,255,.25);
    }
`;
document.head.appendChild(style);

// 添加搜索输入框的事件监听
document.getElementById('searchInput').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        searchProducts();
    } else if (event.key === 'Escape') {
        event.target.value = '';
        displayInventory(currentProducts);
    }
});

// 添加搜索输入框的清空按钮事件
document.getElementById('searchInput').addEventListener('input', (event) => {
    if (event.target.value === '') {
        displayInventory(currentProducts);
    }
});

// 添加退出登录功能
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}
  