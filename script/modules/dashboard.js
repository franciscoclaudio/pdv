// ===========================
// DASHBOARD - Dashboard e Estatísticas
// ===========================

import { dataManager } from './dataManager.js';
import { formatCurrency, formatTime, getStatusText, isToday } from '../utils/helpers.js';

/**
 * Gerenciador do dashboard
 */
export class DashboardManager {
    constructor() {
        this.initialized = false;
    }

    /**
     * Inicializa dashboard
     */
    initialize() {
        if (this.initialized) return;
        this.initialized = true;

        this.updateView();
    }

    /**
     * Atualiza visualização completa
     */
    updateView() {
        this.updateCards();
        this.updateRecentOrdersTable();
    }

    /**
     * Atualiza cards de estatísticas
     */
    updateCards() {
        const todayOrders = dataManager.orders.filter(order => isToday(order.createdAt));

        const totalSales = todayOrders
            .filter(o => o.paymentStatus === "paid" || o.paymentStatus === "closed")
            .reduce((sum, order) => sum + (order.total || 0), 0);

        const activeOrders = dataManager.orders.filter(
            order => order.status === "pending" || order.status === "preparing"
        ).length;

        const customersServed = todayOrders.filter(
            order => order.status === "delivered" || 
                     order.paymentStatus === "paid" || 
                     order.paymentStatus === "closed"
        ).length;

        const mesasOcupadas = dataManager.mesas.filter(m => m.status === "ocupada").length;

        const salesElement = document.querySelector(".card:nth-child(1) .card-value");
        const ordersElement = document.querySelector(".card:nth-child(2) .card-value");
        const customersElement = document.querySelector(".card:nth-child(3) .card-value");
        const mesasElement = document.querySelector(".card:nth-child(4) .card-value");

        if (salesElement) salesElement.textContent = formatCurrency(totalSales);
        if (ordersElement) ordersElement.textContent = activeOrders.toString();
        if (customersElement) customersElement.textContent = customersServed.toString();
        if (mesasElement) mesasElement.textContent = `${mesasOcupadas}/${dataManager.mesas.length}`;
    }

    /**
     * Atualiza tabela de pedidos recentes
     */
    updateRecentOrdersTable() {
        const tableBody = document.querySelector(".data-table tbody");
        if (!tableBody) return;

        const recentOrders = [...dataManager.orders]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        tableBody.innerHTML = "";

        if (recentOrders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center;">
                        Nenhum pedido realizado hoje
                    </td>
                </tr>
            `;
            return;
        }

        recentOrders.forEach((order) => {
            const row = document.createElement("tr");
            
            const orderType = order.tableNumber 
                ? `Mesa ${order.tableNumber}` 
                : order.type === "counter" ? "Balcão" : "Delivery";

            const itemsPreview = order.items
                .slice(0, 2)
                .map(item => `${item.quantity}x ${item.name}`)
                .join(", ") + (order.items.length > 2 ? "..." : "");

            row.innerHTML = `
                <td>#${order.id}</td>
                <td>${orderType}</td>
                <td>${itemsPreview}</td>
                <td>${formatCurrency(order.total || 0)}</td>
                <td><span class="status-badge ${order.status}">${getStatusText(order.status)}</span></td>
                <td>${formatTime(order.createdAt)}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }

    /**
     * Obtém estatísticas do dia
     */
    getTodayStats() {
        const todayOrders = dataManager.orders.filter(order => isToday(order.createdAt));

        return {
            totalOrders: todayOrders.length,
            totalSales: todayOrders
                .filter(o => o.paymentStatus === "paid" || o.paymentStatus === "closed")
                .reduce((sum, o) => sum + (o.total || 0), 0),
            activeOrders: todayOrders.filter(
                o => o.status === "pending" || o.status === "preparing"
            ).length,
            completedOrders: todayOrders.filter(
                o => o.status === "delivered" || o.paymentStatus === "paid"
            ).length
        };
    }

    /**
     * Obtém estatísticas gerais
     */
    getGeneralStats() {
        return {
            totalOrders: dataManager.orders.length,
            totalProducts: dataManager.products.length,
            totalTables: dataManager.mesas.length,
            occupiedTables: dataManager.mesas.filter(m => m.status === "ocupada").length,
            totalRevenue: dataManager.orders
                .filter(o => o.paymentStatus === "paid" || o.paymentStatus === "closed")
                .reduce((sum, o) => sum + (o.total || 0), 0)
        };
    }
}

// Exporta instância singleton
export const dashboardManager = new DashboardManager();