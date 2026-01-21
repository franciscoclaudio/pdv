// ===========================
// KITCHEN - Cozinha
// ===========================

import { dataManager } from './dataManager.js';
import { NotificationSystem } from './notifications.js';
import { formatTime, getOrderTypeText } from '../utils/helpers.js';

/**
 * Gerenciador da cozinha
 */
export class KitchenManager {
    constructor() {
        this.initialized = false;
    }

    /**
     * Inicializa módulo da cozinha
     */
    initialize() {
        if (this.initialized) return;
        this.initialized = true;

        this.updateView();
    }

    /**
     * Atualiza visualização da cozinha
     */
    updateView() {
        const pendingColumn = document.getElementById("pending-orders");
        const preparingColumn = document.getElementById("preparing-orders");
        const readyColumn = document.getElementById("ready-orders");

        if (!pendingColumn || !preparingColumn || !readyColumn) return;

        pendingColumn.innerHTML = "";
        preparingColumn.innerHTML = "";
        readyColumn.innerHTML = "";

        const activeOrders = dataManager.orders.filter(
            order => order.status !== "delivered" && order.paymentStatus !== "closed"
        );

        if (activeOrders.length === 0) {
            pendingColumn.innerHTML = '<div class="no-orders">Nenhum pedido pendente</div>';
            preparingColumn.innerHTML = '<div class="no-orders">Nenhum pedido em preparo</div>';
            readyColumn.innerHTML = '<div class="no-orders">Nenhum pedido pronto</div>';
            return;
        }

        activeOrders.forEach((order) => {
            const card = this.createKanbanCard(order);

            switch (order.status) {
                case "pending":
                    pendingColumn.appendChild(card);
                    break;
                case "preparing":
                    preparingColumn.appendChild(card);
                    break;
                case "ready":
                    readyColumn.appendChild(card);
                    break;
            }
        });

        // Placeholders
        if (pendingColumn.children.length === 0) {
            pendingColumn.innerHTML = '<div class="no-orders">Nenhum pedido pendente</div>';
        }
        if (preparingColumn.children.length === 0) {
            preparingColumn.innerHTML = '<div class="no-orders">Nenhum pedido em preparo</div>';
        }
        if (readyColumn.children.length === 0) {
            readyColumn.innerHTML = '<div class="no-orders">Nenhum pedido pronto</div>';
        }
    }

    /**
     * Cria card kanban
     */
    createKanbanCard(order) {
        const card = document.createElement("div");
        card.className = "kanban-card";

        card.innerHTML = `
            <div class="kanban-card-header">
                <div class="kanban-card-title">Pedido #${order.id}</div>
                <div class="kanban-card-time">${formatTime(order.createdAt)}</div>
            </div>
            <div class="kanban-card-details">
                <div>
                    ${getOrderTypeText(order.type)} 
                    ${order.tableNumber ? `- Mesa ${order.tableNumber}` : ""}
                </div>
                ${order.waiter ? `<div class="kanban-card-waiter">Garçom: ${order.waiter}</div>` : ""}
            </div>
            <div class="kanban-card-items">
                ${order.items.map(item => `
                    <div class="kanban-card-item">
                        <span>${item.quantity}x ${item.name}</span>
                    </div>
                `).join("")}
            </div>
            <div class="kanban-card-actions">
                ${this.getActionButtons(order)}
            </div>
        `;

        // Event listeners
        card.querySelectorAll("button").forEach((btn) => {
            btn.addEventListener("click", () => {
                const orderId = parseInt(btn.getAttribute("data-id"));
                const action = btn.getAttribute("data-action");
                this.handleAction(orderId, action);
            });
        });

        return card;
    }

    /**
     * Obtém botões de ação
     */
    getActionButtons(order) {
        let buttons = "";

        if (order.status === "pending") {
            buttons += `<button class="btn btn-primary btn-sm" data-id="${order.id}" data-action="start">Iniciar Preparo</button>`;
        }

        if (order.status === "preparing") {
            buttons += `<button class="btn btn-success btn-sm" data-id="${order.id}" data-action="ready">Marcar Pronto</button>`;
        }

        return buttons;
    }

    /**
     * Trata ações
     */
    handleAction(orderId, action) {
        const order = dataManager.orders.find(o => o.id === orderId);
        if (!order) {
            NotificationSystem.error("Pedido não encontrado");
            return;
        }

        switch (action) {
            case "start":
                order.status = "preparing";
                order.updatedAt = new Date();
                NotificationSystem.success("Preparo iniciado!");
                break;

            case "ready":
                order.status = "ready";
                order.updatedAt = new Date();
                NotificationSystem.success("Pedido pronto!");
                break;
        }

        dataManager.saveAppData();
        this.updateView();

        // Dispara evento
        document.dispatchEvent(new Event('ordersUpdated'));
    }
}

// Exporta instância singleton
export const kitchenManager = new KitchenManager();