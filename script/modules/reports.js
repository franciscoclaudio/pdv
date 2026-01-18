// script/modules/reports.js

import { 
    orders, 
    products, 
    mesas,
    currentUser 
} from '../utils/constants.js';
import { NotificationSystem } from './notifications.js';
import { DataManager } from './dataManager.js';
import { 
    formatTime,
    formatDate,
    formatCurrency 
} from '../utils/helpers.js';

export function initializeRelatorios() {
    if (!currentUser || !currentUser.permissions.includes("relatorios")) {
        const relatoriosTab = document.querySelector('.nav-item[data-tab="relatorios"]');
        if (relatoriosTab) relatoriosTab.style.display = "none";
        return;
    }

    // Configurar botões e eventos
    setupReportControls();
    
    // Gerar relatório inicial
    generateInitialReport();
}

function setupReportControls() {
    const generateReportBtn = document.getElementById("generate-report");
    const exportReportBtn = document.getElementById("export-report");
    const periodSelect = document.getElementById("report-period");
    const exportBackupBtn = document.getElementById("export-backup");
    const importBackupBtn = document.getElementById("import-backup");
    const backupFileInput = document.getElementById("backup-file");

    // Gerar relatório
    if (generateReportBtn) {
        generateReportBtn.addEventListener("click", generateReport);
    }

    // Exportar relatório
    if (exportReportBtn) {
        exportReportBtn.addEventListener("click", exportReport);
    }

    // Período personalizado
    if (periodSelect) {
        periodSelect.addEventListener("change", function() {
            toggleCustomDateInputs(this.value === "custom");
        });
    }

    // Backup/Export
    if (exportBackupBtn) {
        exportBackupBtn.addEventListener("click", () => DataManager.exportData());
    }

    if (importBackupBtn) {
        importBackupBtn.addEventListener("click", () => {
            if (backupFileInput) backupFileInput.click();
        });
    }

    if (backupFileInput) {
        backupFileInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                DataManager.importData(e.target.files[0]);
                e.target.value = "";
            }
        });
    }
}

function toggleCustomDateInputs(show) {
    const customDatesGroup = document.getElementById("custom-dates-group");
    const customDatesGroupEnd = document.getElementById("custom-dates-group-end");
    
    if (customDatesGroup) customDatesGroup.style.display = show ? "block" : "none";
    if (customDatesGroupEnd) customDatesGroupEnd.style.display = show ? "block" : "none";
}

function generateInitialReport() {
    // Gerar relatório com dados do dia atual
    generateSalesReport("today");
}

export function generateReport() {
    const period = document.getElementById("report-period")?.value || "today";
    const reportType = document.getElementById("report-type")?.value || "sales";
    
    switch(reportType) {
        case "sales":
            generateSalesReport(period);
            break;
        case "products":
            generateProductsReport(period);
            break;
        case "time":
            generateTimeReport(period);
            break;
        default:
            generateSalesReport(period);
    }
}

function generateSalesReport(period) {
    const filteredOrders = filterOrdersByPeriod(period);
    const resultsContainer = document.getElementById("report-results-container");
    
    if (!resultsContainer) return;

    // Calcular métricas
    const totalSales = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const paidOrders = filteredOrders.filter(o => o.paymentStatus === "paid" || o.paymentStatus === "closed");
    const totalPaid = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingPayment = totalSales - totalPaid;
    
    const avgOrderValue = filteredOrders.length > 0 ? totalSales / filteredOrders.length : 0;
    
    // Agrupar por tipo de pedido
    const ordersByType = filteredOrders.reduce((acc, order) => {
        acc[order.type] = (acc[order.type] || 0) + 1;
        return acc;
    }, {});
    
    // Agrupar por método de pagamento
    const paymentsByMethod = paidOrders.reduce((acc, order) => {
        const method = order.paymentMethod || "unknown";
        acc[method] = (acc[method] || 0) + (order.total || 0);
        return acc;
    }, {});

    const reportHTML = `
        <div class="report-summary">
            <h4>📊 Relatório de Vendas</h4>
            <p><strong>Período:</strong> ${getPeriodLabel(period)}</p>
            <p><strong>Total de Pedidos:</strong> ${filteredOrders.length}</p>
            <p><strong>Pedidos Pagos:</strong> ${paidOrders.length}</p>
            <p><strong>Faturamento Total:</strong> ${formatCurrency(totalSales)}</p>
            <p><strong>Recebido:</strong> ${formatCurrency(totalPaid)}</p>
            <p><strong>Pendente:</strong> ${formatCurrency(pendingPayment)}</p>
            <p><strong>Ticket Médio:</strong> ${formatCurrency(avgOrderValue)}</p>
        </div>
        
        <div class="report-details">
            <div class="detail-section">
                <h5>📋 Distribuição por Tipo de Pedido</h5>
                ${Object.entries(ordersByType).map(([type, count]) => `
                    <div class="detail-item">
                        <span>${getOrderTypeLabel(type)}:</span>
                        <span>${count} pedidos</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="detail-section">
                <h5>💰 Distribuição por Método de Pagamento</h5>
                ${Object.entries(paymentsByMethod).map(([method, total]) => `
                    <div class="detail-item">
                        <span>${getPaymentMethodLabel(method)}:</span>
                        <span>${formatCurrency(total)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="detail-section">
                <h5>📈 Top 5 Produtos Mais Vendidos</h5>
                ${getTopProducts(filteredOrders, 5)}
            </div>
        </div>
        
        <div class="report-table">
            <h5>📋 Últimos Pedidos</h5>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Pedido</th>
                            <th>Data/Hora</th>
                            <th>Cliente</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Pagamento</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredOrders.slice(0, 10).map(order => `
                            <tr>
                                <td>#${order.id}</td>
                                <td>${formatTime(order.createdAt)}</td>
                                <td>${order.customerName || '—'}</td>
                                <td>${formatCurrency(order.total)}</td>
                                <td>${getStatusLabel(order.status)}</td>
                                <td>${getPaymentStatusLabel(order.paymentStatus)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = reportHTML;
    NotificationSystem.show("Relatório de vendas gerado com sucesso!", "success");
}

function generateProductsReport(period) {
    const filteredOrders = filterOrdersByPeriod(period);
    const resultsContainer = document.getElementById("report-results-container");
    
    if (!resultsContainer) return;

    // Agrupar produtos vendidos
    const productSales = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            if (!productSales[item.productId]) {
                productSales[item.productId] = {
                    name: item.name,
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[item.productId].quantity += item.quantity;
            productSales[item.productId].revenue += item.price * item.quantity;
        });
    });

    // Converter para array e ordenar
    const productArray = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = productArray.reduce((sum, p) => sum + p.revenue, 0);

    const reportHTML = `
        <div class="report-summary">
            <h4>🍕 Relatório de Produtos</h4>
            <p><strong>Período:</strong> ${getPeriodLabel(period)}</p>
            <p><strong>Total de Produtos Vendidos:</strong> ${productArray.length}</p>
            <p><strong>Unidades Vendidas:</strong> ${productArray.reduce((sum, p) => sum + p.quantity, 0)}</p>
            <p><strong>Faturamento Total:</strong> ${formatCurrency(totalRevenue)}</p>
        </div>
        
        <div class="report-table">
            <h5>📊 Produtos Mais Vendidos</h5>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Quantidade</th>
                            <th>Faturamento</th>
                            <th>% do Total</th>
                            <th>Ticket Médio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productArray.slice(0, 15).map(product => {
                            const percent = totalRevenue > 0 ? (product.revenue / totalRevenue * 100).toFixed(1) : 0;
                            const avgTicket = product.quantity > 0 ? product.revenue / product.quantity : 0;
                            return `
                                <tr>
                                    <td>${product.name}</td>
                                    <td>${product.quantity}</td>
                                    <td>${formatCurrency(product.revenue)}</td>
                                    <td>${percent}%</td>
                                    <td>${formatCurrency(avgTicket)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="report-chart">
            <h5>📈 Distribuição de Vendas por Produto</h5>
            <div class="chart-container">
                ${productArray.slice(0, 8).map((product, index) => {
                    const percent = totalRevenue > 0 ? (product.revenue / totalRevenue * 100).toFixed(1) : 0;
                    const width = Math.min(percent * 3, 100); // Escalar para visualização
                    return `
                        <div class="chart-bar">
                            <div class="chart-label">${product.name}</div>
                            <div class="chart-bar-container">
                                <div class="chart-bar-fill" style="width: ${width}%"></div>
                                <div class="chart-value">${percent}% (${formatCurrency(product.revenue)})</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    resultsContainer.innerHTML = reportHTML;
    NotificationSystem.show("Relatório de produtos gerado com sucesso!", "success");
}

function generateTimeReport(period) {
    const filteredOrders = filterOrdersByPeriod(period);
    const resultsContainer = document.getElementById("report-results-container");
    
    if (!resultsContainer) return;

    // Calcular métricas de tempo
    const completedOrders = filteredOrders.filter(o => 
        o.status === "delivered" && o.createdAt && o.updatedAt
    );
    
    let totalPrepTime = 0;
    let totalWaitTime = 0;
    
    completedOrders.forEach(order => {
        const createdAt = new Date(order.createdAt);
        const updatedAt = new Date(order.updatedAt || order.createdAt);
        const prepTime = (updatedAt - createdAt) / (1000 * 60); // minutos
        
        totalPrepTime += prepTime;
        
        // Tempo de espera (do pedido até início do preparo)
        // Esta é uma simplificação - em um sistema real você teria mais dados
        totalWaitTime += prepTime * 0.3; // Estimativa
    });
    
    const avgPrepTime = completedOrders.length > 0 ? 
        Math.round(totalPrepTime / completedOrders.length) : 0;
    
    const avgWaitTime = completedOrders.length > 0 ? 
        Math.round(totalWaitTime / completedOrders.length) : 0;
    
    // Agrupar por hora do dia
    const ordersByHour = Array(24).fill(0);
    filteredOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        ordersByHour[hour]++;
    });

    const reportHTML = `
        <div class="report-summary">
            <h4>⏱️ Relatório de Tempo</h4>
            <p><strong>Período:</strong> ${getPeriodLabel(period)}</p>
            <p><strong>Pedidos Completados:</strong> ${completedOrders.length}</p>
            <p><strong>Tempo Médio de Preparo:</strong> ${avgPrepTime} minutos</p>
            <p><strong>Tempo Médio de Espera:</strong> ${avgWaitTime} minutos</p>
            <p><strong>Eficiência:</strong> ${calculateEfficiency(completedOrders)}%</p>
        </div>
        
        <div class="report-chart">
            <h5>📈 Pedidos por Hora do Dia</h5>
            <div class="chart-container hourly-chart">
                ${ordersByHour.map((count, hour) => {
                    const maxCount = Math.max(...ordersByHour);
                    const height = maxCount > 0 ? (count / maxCount * 100) : 0;
                    return `
                        <div class="hour-bar">
                            <div class="hour-label">${hour.toString().padStart(2, '0')}h</div>
                            <div class="bar-container">
                                <div class="bar-fill" style="height: ${height}%"></div>
                            </div>
                            <div class="hour-count">${count}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="report-details">
            <div class="detail-section">
                <h5>⚡ Pedidos Mais Rápidos</h5>
                ${getFastestOrders(completedOrders, 5)}
            </div>
            
            <div class="detail-section">
                <h5>🐌 Pedidos Mais Lentos</h5>
                ${getSlowestOrders(completedOrders, 5)}
            </div>
        </div>
    `;

    resultsContainer.innerHTML = reportHTML;
    NotificationSystem.show("Relatório de tempo gerado com sucesso!", "success");
}

// Funções auxiliares
function filterOrdersByPeriod(period) {
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
        case "today":
            startDate.setHours(0, 0, 0, 0);
            break;
        case "yesterday":
            startDate.setDate(startDate.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            return orders.filter(o => {
                const orderDate = new Date(o.createdAt);
                return orderDate >= startDate && orderDate < endDate;
            });
        case "week":
            startDate.setDate(startDate.getDate() - 7);
            break;
        case "month":
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case "custom":
            const dateStart = document.getElementById("date-start")?.value;
            const dateEnd = document.getElementById("date-end")?.value;
            
            if (dateStart && dateEnd) {
                const customStart = new Date(dateStart);
                const customEnd = new Date(dateEnd);
                customEnd.setDate(customEnd.getDate() + 1); // Incluir o dia final
                
                return orders.filter(o => {
                    const orderDate = new Date(o.createdAt);
                    return orderDate >= customStart && orderDate < customEnd;
                });
            }
            return orders;
        default:
            return orders;
    }
    
    return orders.filter(o => new Date(o.createdAt) >= startDate);
}

function getPeriodLabel(period) {
    const labels = {
        today: "Hoje",
        yesterday: "Ontem",
        week: "Últimos 7 dias",
        month: "Último mês",
        custom: "Personalizado"
    };
    return labels[period] || period;
}

function getOrderTypeLabel(type) {
    const labels = {
        table: "Mesa",
        counter: "Balcão",
        delivery: "Delivery"
    };
    return labels[type] || type;
}

function getPaymentMethodLabel(method) {
    const labels = {
        cash: "Dinheiro",
        card: "Cartão",
        pix: "PIX",
        meal_voucher: "Vale Refeição",
        unknown: "Não especificado"
    };
    return labels[method] || method;
}

function getStatusLabel(status) {
    const labels = {
        pending: "Pendente",
        preparing: "Preparando",
        ready: "Pronto",
        delivered: "Entregue",
        paid: "Pago",
        closed: "Fechado"
    };
    return labels[status] || status;
}

function getPaymentStatusLabel(status) {
    const labels = {
        pending: "Pendente",
        paid: "Pago",
        closed: "Fechado"
    };
    return labels[status] || status;
}

function getTopProducts(orders, limit) {
    const productCounts = {};
    
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!productCounts[item.name]) {
                productCounts[item.name] = {
                    quantity: 0,
                    revenue: 0
                };
            }
            productCounts[item.name].quantity += item.quantity;
            productCounts[item.name].revenue += item.price * item.quantity;
        });
    });
    
    const topProducts = Object.entries(productCounts)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);
    
    return topProducts.map(product => `
        <div class="detail-item">
            <span>${product.name}:</span>
            <span>${product.quantity} unidades (${formatCurrency(product.revenue)})</span>
        </div>
    `).join('');
}

function calculateEfficiency(orders) {
    if (orders.length === 0) return 0;
    
    // Simplificação: eficiência baseada no tempo de preparo
    const targetTime = 30; // 30 minutos como tempo alvo
    let efficiencySum = 0;
    
    orders.forEach(order => {
        const prepTime = (new Date(order.updatedAt) - new Date(order.createdAt)) / (1000 * 60);
        const efficiency = Math.max(0, Math.min(100, (targetTime / prepTime) * 100));
        efficiencySum += efficiency;
    });
    
    return Math.round(efficiencySum / orders.length);
}

function getFastestOrders(orders, limit) {
    const ordersWithTime = orders.map(order => {
        const prepTime = (new Date(order.updatedAt) - new Date(order.createdAt)) / (1000 * 60);
        return { ...order, prepTime };
    }).sort((a, b) => a.prepTime - b.prepTime)
      .slice(0, limit);
    
    return ordersWithTime.map(order => `
        <div class="detail-item">
            <span>Pedido #${order.id}:</span>
            <span>${Math.round(order.prepTime)} minutos</span>
        </div>
    `).join('');
}

function getSlowestOrders(orders, limit) {
    const ordersWithTime = orders.map(order => {
        const prepTime = (new Date(order.updatedAt) - new Date(order.createdAt)) / (1000 * 60);
        return { ...order, prepTime };
    }).sort((a, b) => b.prepTime - a.prepTime)
      .slice(0, limit);
    
    return ordersWithTime.map(order => `
        <div class="detail-item">
            <span>Pedido #${order.id}:</span>
            <span>${Math.round(order.prepTime)} minutos</span>
        </div>
    `).join('');
}

function exportReport() {
    const period = document.getElementById("report-period")?.value || "today";
    const reportType = document.getElementById("report-type")?.value || "sales";
    const filteredOrders = filterOrdersByPeriod(period);
    
    const reportData = {
        type: reportType,
        period: period,
        periodLabel: getPeriodLabel(period),
        generatedAt: new Date().toISOString(),
        totalOrders: filteredOrders.length,
        totalSales: filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        orders: filteredOrders,
        products: products,
        summary: {
            paidOrders: filteredOrders.filter(o => o.paymentStatus === "paid" || o.paymentStatus === "closed").length,
            pendingOrders: filteredOrders.filter(o => o.paymentStatus === "pending").length
        }
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${reportType}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    NotificationSystem.show("Relatório exportado com sucesso!", "success");
}

export function updateRelatoriosView() {
    // Atualizar view se necessário
    const container = document.getElementById("relatorios-container");
    if (container && !container.querySelector('.report-summary')) {
        generateInitialReport();
    }
}