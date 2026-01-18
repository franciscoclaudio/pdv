// script/modules/dashboard.js

import { 
    orders, 
    mesas, 
    products, 
    inventory 
} from '../utils/constants.js';
import { 
    formatTime,
    formatCurrency,
    getStatusText,
    getStatusColor 
} from '../utils/helpers.js';

export function initializeDashboard() {
    updateDashboard();
    
    // Atualizar dashboard a cada 30 segundos
    setInterval(updateDashboard, 30000);
}

export function updateDashboard() {
    updateDashboardCards();
    updateRecentOrdersTable();
    updateInventoryAlerts();
    updatePerformanceMetrics();
}

function updateDashboardCards() {
    const today = new Date().toDateString();
    const todayOrders = orders.filter((order) => 
        new Date(order.createdAt).toDateString() === today
    );

    // Vendas hoje
    const totalSales = todayOrders
        .filter((o) => o.paymentStatus === "paid" || o.paymentStatus === "closed")
        .reduce((sum, order) => sum + (order.total || 0), 0);

    // Pedidos ativos
    const activeOrders = orders.filter((order) => 
        order.status === "pending" || order.status === "preparing"
    ).length;

    // Clientes atendidos hoje
    const customersServed = todayOrders.filter(
        (order) => order.status === "delivered" || 
                  order.paymentStatus === "paid" || 
                  order.paymentStatus === "closed"
    ).length;

    // Mesas ocupadas
    const mesasOcupadas = mesas.filter((m) => m.status === "ocupada").length;

    // Atualizar elementos
    const salesElement = document.querySelector(".card:nth-child(1) .card-value");
    const ordersElement = document.querySelector(".card:nth-child(2) .card-value");
    const customersElement = document.querySelector(".card:nth-child(3) .card-value");
    const mesasElement = document.querySelector(".card:nth-child(4) .card-value");

    if (salesElement) salesElement.textContent = formatCurrency(totalSales);
    if (ordersElement) ordersElement.textContent = activeOrders.toString();
    if (customersElement) customersElement.textContent = customersServed.toString();
    if (mesasElement) mesasElement.textContent = `${mesasOcupadas}/${mesas.length}`;

    // Atualizar mudanças/percents
    updateCardChanges();
}

function updateCardChanges() {
    const cards = document.querySelectorAll('.card .card-change');
    if (!cards.length) return;

    // Aqui você pode adicionar lógica para calcular mudanças
    // em relação ao período anterior (ontem, semana passada, etc.)
    
    // Por enquanto, vamos mostrar informações estáticas ou calcular simples
    cards.forEach((card, index) => {
        switch(index) {
            case 0: // Vendas
                card.textContent = "Hoje";
                break;
            case 1: // Pedidos ativos
                const pendingOrders = orders.filter(o => o.status === "pending").length;
                const preparingOrders = orders.filter(o => o.status === "preparing").length;
                card.textContent = `${pendingOrders} pendentes, ${preparingOrders} preparando`;
                break;
            case 2: // Clientes
                card.textContent = "Atendidos hoje";
                break;
            case 3: // Mesas
                const mesasLivres = mesas.filter(m => m.status === "livre").length;
                card.textContent = `${mesasLivres} livres`;
                break;
        }
    });
}

export function updateRecentOrdersTable() {
    const tableBody = document.querySelector(".data-table tbody");
    if (!tableBody) return;

    // Ordenar pedidos por data (mais recente primeiro)
    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10); // Limitar a 10 pedidos

    tableBody.innerHTML = "";

    if (recentOrders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center;">
                    <div class="no-orders">Nenhum pedido realizado</div>
                </td>
            </tr>
        `;
        return;
    }

    recentOrders.forEach((order) => {
        const row = document.createElement("tr");
        row.dataset.orderId = order.id;
        
        // Calcular tempo decorrido
        const elapsedTime = getElapsedTime(order.createdAt);
        
        row.innerHTML = `
            <td>
                <strong>#${order.id}</strong>
                <div class="order-type">${getOrderTypeText(order.type)}</div>
            </td>
            <td>
                ${order.tableNumber ? `Mesa ${order.tableNumber}` : ''}
                ${order.customerName ? `<div class="customer-name">${order.customerName}</div>` : ''}
            </td>
            <td>
                <div class="order-items-preview">
                    ${order.items.slice(0, 2).map(item => 
                        `${item.quantity}x ${item.name}`
                    ).join(", ")}
                    ${order.items.length > 2 ? ` +${order.items.length - 2} mais` : ''}
                </div>
            </td>
            <td>
                <strong>${formatCurrency(order.total)}</strong>
                <div class="payment-status ${order.paymentStatus}">
                    ${getPaymentStatusText(order.paymentStatus)}
                </div>
            </td>
            <td>
                <span class="status-badge" style="background-color: ${getStatusColor(order.status)}">
                    ${getStatusText(order.status)}
                </span>
                <div class="elapsed-time">${elapsedTime}</div>
            </td>
            <td>
                <div class="order-time">${formatTime(order.createdAt)}</div>
                ${order.updatedAt ? `<div class="updated-time">Atualizado: ${formatTime(order.updatedAt)}</div>` : ''}
            </td>
        `;

        // Adicionar evento de clique para ver detalhes
        row.addEventListener('click', () => {
            showOrderDetails(order.id);
        });

        tableBody.appendChild(row);
    });
}

function getOrderTypeText(type) {
    const types = {
        table: "Mesa",
        counter: "Balcão",
        delivery: "Delivery"
    };
    return types[type] || type;
}

function getPaymentStatusText(status) {
    const statusMap = {
        pending: "Pendente",
        paid: "Pago",
        closed: "Fechado"
    };
    return statusMap[status] || status;
}

function getElapsedTime(date) {
    if (!date) return "";
    
    const created = new Date(date);
    const now = new Date();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `${diffMins} min atrás`;
    
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days} dia${days > 1 ? 's' : ''} atrás`;
}

function updateInventoryAlerts() {
    const inventoryAlertContainer = document.getElementById("inventory-alerts");
    if (!inventoryAlertContainer) return;

    // Filtrar itens com estoque baixo
    const lowStockItems = inventory.filter(item => 
        item.currentStock <= item.minStock
    );

    if (lowStockItems.length === 0) {
        inventoryAlertContainer.innerHTML = `
            <div class="alert alert-success">
                <strong>✓ Estoque OK</strong>
                <p>Todos os produtos têm estoque suficiente.</p>
            </div>
        `;
        return;
    }

    let alertsHTML = `
        <div class="alert alert-warning">
            <strong>⚠️ Alerta de Estoque</strong>
            <p>${lowStockItems.length} produto(s) com estoque baixo:</p>
            <ul>
    `;

    lowStockItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            alertsHTML += `
                <li>
                    <strong>${product.name}</strong>: 
                    ${item.currentStock} unidades (mínimo: ${item.minStock})
                </li>
            `;
        }
    });

    alertsHTML += `
            </ul>
        </div>
    `;

    inventoryAlertContainer.innerHTML = alertsHTML;
}

function updatePerformanceMetrics() {
    const metricsContainer = document.getElementById("performance-metrics");
    if (!metricsContainer) return;

    // Calcular métricas
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => 
        new Date(o.createdAt).toDateString() === today
    );
    
    const totalOrdersToday = todayOrders.length;
    const avgOrderValue = totalOrdersToday > 0 
        ? todayOrders.reduce((sum, o) => sum + o.total, 0) / totalOrdersToday
        : 0;
    
    const avgPreparationTime = calculateAvgPreparationTime();
    const tableTurnover = calculateTableTurnover();

    metricsContainer.innerHTML = `
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${totalOrdersToday}</div>
                <div class="metric-label">Pedidos Hoje</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatCurrency(avgOrderValue)}</div>
                <div class="metric-label">Ticket Médio</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${avgPreparationTime}min</div>
                <div class="metric-label">Tempo Médio de Preparo</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${tableTurnover}</div>
                <div class="metric-label">Giro de Mesas</div>
            </div>
        </div>
    `;
}

function calculateAvgPreparationTime() {
    const completedOrders = orders.filter(o => 
        o.status === "delivered" && o.createdAt && o.updatedAt
    );
    
    if (completedOrders.length === 0) return 0;
    
    const totalTime = completedOrders.reduce((sum, order) => {
        const start = new Date(order.createdAt);
        const end = new Date(order.updatedAt || order.createdAt);
        return sum + (end - start);
    }, 0);
    
    return Math.round(totalTime / (completedOrders.length * 60000)); // Converter para minutos
}

function calculateTableTurnover() {
    // Esta é uma implementação simplificada
    // Em um sistema real, você calcularia quantas vezes cada mesa foi ocupada hoje
    const occupiedTables = mesas.filter(m => m.status === "ocupada").length;
    const totalTables = mesas.length;
    
    return occupiedTables > 0 ? ((occupiedTables / totalTables) * 100).toFixed(1) + '%' : '0%';
}

function showOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const details = `
        <h3>Detalhes do Pedido #${order.id}</h3>
        <p><strong>Tipo:</strong> ${getOrderTypeText(order.type)}</p>
        ${order.tableNumber ? `<p><strong>Mesa:</strong> ${order.tableNumber}</p>` : ''}
        ${order.customerName ? `<p><strong>Cliente:</strong> ${order.customerName}</p>` : ''}
        <p><strong>Status:</strong> ${getStatusText(order.status)}</p>
        <p><strong>Pagamento:</strong> ${getPaymentStatusText(order.paymentStatus)}</p>
        <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
        <p><strong>Criado em:</strong> ${formatTime(order.createdAt)}</p>
    `;

    NotificationSystem.alert(details, `Pedido #${order.id}`);
}