// script/modules/kitchen.js

import { 
    orders, 
    currentUser 
} from '../utils/constants.js';
import { NotificationSystem } from './notifications.js';
import { DataManager } from './dataManager.js';
import { 
    formatTime,
    getOrderTypeText,
    getStatusText 
} from '../utils/helpers.js';
import { handleOrderAction } from './orders.js';
import { updateOrdersView } from './orders.js';
import { updateDashboard } from './dashboard.js';

export function initializeCozinha() {
    if (!currentUser || !currentUser.permissions.includes("cozinha")) {
        const cozinhaTab = document.querySelector('.nav-item[data-tab="cozinha"]');
        if (cozinhaTab) cozinhaTab.style.display = "none";
        return;
    }

    updateCozinhaView();
}

export function updateCozinhaView() {
    const pendingColumn = document.getElementById("pending-orders");
    const preparingColumn = document.getElementById("preparing-orders");
    const readyColumn = document.getElementById("ready-orders");

    if (!pendingColumn || !preparingColumn || !readyColumn) return;

    pendingColumn.innerHTML = "";
    preparingColumn.innerHTML = "";
    readyColumn.innerHTML = "";

    // Filtrar pedidos ativos (não entregues e não fechados)
    const activeOrders = orders.filter((order) => 
        order.status !== "delivered" && 
        order.paymentStatus !== "closed"
    );

    if (activeOrders.length === 0) {
        pendingColumn.innerHTML = '<div class="no-orders">Nenhum pedido pendente</div>';
        preparingColumn.innerHTML = '<div class="no-orders">Nenhum pedido em preparo</div>';
        readyColumn.innerHTML = '<div class="no-orders">Nenhum pedido pronto</div>';
        return;
    }

    // Criar cards para cada pedido
    activeOrders.forEach((order) => {
        createKitchenCard(order, pendingColumn, preparingColumn, readyColumn);
    });

    // Adicionar placeholders se necessário
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

function createKitchenCard(order, pendingColumn, preparingColumn, readyColumn) {
    const card = document.createElement("div");
    card.className = "kanban-card";
    card.dataset.orderId = order.id;

    // Calcular tempo de espera
    const waitTime = calculateWaitTime(order.createdAt);
    
    card.innerHTML = `
        <div class="kanban-card-header">
            <div class="kanban-card-title">
                <strong>Pedido #${order.id}</strong>
                <span class="kanban-card-wait">${waitTime}</span>
            </div>
            <div class="kanban-card-time">${formatTime(order.createdAt)}</div>
        </div>
        <div class="kanban-card-details">
            <div>${getOrderTypeText(order.type)} ${order.tableNumber ? `- Mesa ${order.tableNumber}` : ""}</div>
            ${order.customerName ? `<div class="kanban-card-customer">${order.customerName}</div>` : ""}
            ${order.waiter ? `<div class="kanban-card-waiter">Garçom: ${order.waiter}</div>` : ""}
        </div>
        <div class="kanban-card-items">
            ${order.items.map((item) => `
                <div class="kanban-card-item">
                    <span class="kanban-card-item-quantity">${item.quantity}x</span>
                    <span class="kanban-card-item-name">${item.name}</span>
                    ${item.notes ? `<span class="kanban-card-item-notes">(${item.notes})</span>` : ''}
                </div>
            `).join("")}
        </div>
        <div class="kanban-card-priority ${getPriorityClass(order)}">
            ${getPriorityText(order)}
        </div>
        <div class="kanban-card-actions">
            ${getKitchenActionButtons(order)}
        </div>
    `;

    // Adicionar event listeners aos botões
    card.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", function () {
            const orderId = parseInt(this.dataset.id);
            const action = this.dataset.action;
            handleKitchenOrderAction(orderId, action);
        });
    });

    // Adicionar à coluna apropriada
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
        default:
            // Por segurança, adicionar à coluna de pendentes
            pendingColumn.appendChild(card);
            break;
    }
}

function calculateWaitTime(createdAt) {
    if (!createdAt) return "";
    
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins} min`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}min`;
}

function getPriorityClass(order) {
    const created = new Date(order.createdAt);
    const now = new Date();
    const diffMins = Math.floor((now - created) / (1000 * 60));
    
    if (diffMins > 30) return "priority-high";
    if (diffMins > 15) return "priority-medium";
    return "priority-low";
}

function getPriorityText(order) {
    const created = new Date(order.createdAt);
    const now = new Date();
    const diffMins = Math.floor((now - created) / (1000 * 60));
    
    if (diffMins > 30) return "⚡ URGENTE";
    if (diffMins > 15) return "⚠️ ALTA PRIORIDADE";
    return "⏱️ NORMAL";
}

function getKitchenActionButtons(order) {
    let buttons = "";
    
    if (order.status === "pending") {
        buttons += `
            <button class="btn btn-primary" data-id="${order.id}" data-action="start">
                Iniciar Preparo
            </button>
        `;
    }

    if (order.status === "preparing") {
        buttons += `
            <button class="btn btn-success" data-id="${order.id}" data-action="ready">
                Marcar Pronto
            </button>
            <button class="btn btn-warning" data-id="${order.id}" data-action="delay">
                Atrasado
            </button>
        `;
    }

    if (order.status === "ready") {
        buttons += `
            <button class="btn btn-info" data-id="${order.id}" data-action="hold">
                Aguardando Entrega
            </button>
        `;
    }

    return buttons;
}

async function handleKitchenOrderAction(orderId, action) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
        NotificationSystem.show("Pedido não encontrado", "error");
        return;
    }

    switch (action) {
        case "start":
            order.status = "preparing";
            order.updatedAt = new Date();
            NotificationSystem.show(`Preparo do pedido #${orderId} iniciado!`, "success");
            break;

        case "ready":
            order.status = "ready";
            order.updatedAt = new Date();
            NotificationSystem.show(`Pedido #${orderId} marcado como pronto!`, "success");
            break;

        case "delay":
            const delayReason = await NotificationSystem.confirm(
                "Informe o motivo do atraso:",
                "Confirmar",
                "Cancelar"
            );
            if (delayReason) {
                order.notes = order.notes ? `${order.notes} | Atrasado: ${new Date().toLocaleTimeString()}` : 
                                           `Atrasado: ${new Date().toLocaleTimeString()}`;
                NotificationSystem.show("Atraso registrado!", "warning");
            }
            break;

        case "hold":
            order.status = "ready";
            order.notes = order.notes ? `${order.notes} | Aguardando entrega` : "Aguardando entrega";
            NotificationSystem.show("Pedido aguardando entrega", "info");
            break;

        case "view":
            showKitchenOrderDetails(order);
            return;
    }

    DataManager.saveAppData();
    updateCozinhaView();
    updateOrdersView();
    updateDashboard();
}

function showKitchenOrderDetails(order) {
    const details = `
🧑‍🍳 DETALHES DA COZINHA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pedido #${order.id}
${order.tableNumber ? `Mesa: ${order.tableNumber}` : getOrderTypeText(order.type)}
${order.customerName ? `Cliente: ${order.customerName}` : ""}
Tempo de espera: ${calculateWaitTime(order.createdAt)}

ITENS:
${order.items.map((i, index) => `${index + 1}. ${i.quantity}x ${i.name}${i.notes ? ` (${i.notes})` : ''}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${getStatusText(order.status)}
Iniciado: ${order.createdAt ? formatTime(order.createdAt) : "N/A"}
Atualizado: ${order.updatedAt ? formatTime(order.updatedAt) : "N/A"}
${order.notes ? `\nObservações: ${order.notes}` : ''}
    `;
    
    NotificationSystem.alert(details, `Pedido #${order.id} - Cozinha`);
}

// Exportar função para atualização global
export function refreshKitchenView() {
    updateCozinhaView();
}