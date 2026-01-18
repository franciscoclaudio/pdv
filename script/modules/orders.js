// script/modules/orders.js

import { 
    orders, 
    currentOrder, 
    currentUser 
} from '../utils/constants.js';
import { NotificationSystem } from './notifications.js';
import { DataManager } from './dataManager.js';
import { 
    formatTime,
    getOrderTypeText,
    getStatusText,
    getPaymentStatusText 
} from '../utils/helpers.js';
import { showPaymentModal } from './modals.js';
import { updateCozinhaView } from './kitchen.js';
import { updateDashboard } from './dashboard.js';
import { updateMesasView } from './tables.js';

export function initializeOrders() {
    if (!currentUser || !currentUser.permissions.includes("pedidos")) {
        const pedidosTab = document.querySelector('.nav-item[data-tab="pedidos"]');
        if (pedidosTab) pedidosTab.style.display = "none";
        return;
    }

    const searchInput = document.getElementById("search-order");
    if (searchInput) {
        searchInput.addEventListener("input", updateOrdersView);
    }

    updateOrdersView();
}

export function updateOrdersView() {
    const atendimentoColumn = document.getElementById("balcao-atendimento");
    const preparandoColumn = document.getElementById("balcao-preparando");
    const prontoColumn = document.getElementById("balcao-pronto");

    if (!atendimentoColumn || !preparandoColumn || !prontoColumn) return;

    atendimentoColumn.innerHTML = "";
    preparandoColumn.innerHTML = "";
    prontoColumn.innerHTML = "";

    // Filtrar pedidos do balcão
    const balcaoOrders = orders.filter((order) => 
        order.type === "counter" && 
        order.paymentStatus !== "closed"
    );

    // Adicionar pedidos às colunas
    balcaoOrders.forEach((order) => {
        createOrderCard(order, atendimentoColumn, preparandoColumn, prontoColumn);
    });

    // Adicionar card de novo pedido
    addNewOrderCard(atendimentoColumn);

    // Adicionar placeholders se necessário
    addPlaceholders(atendimentoColumn, preparandoColumn, prontoColumn);
}

function createOrderCard(order, atendimentoColumn, preparandoColumn, prontoColumn) {
    const card = document.createElement("div");
    card.className = "balcao-card";
    card.dataset.orderId = order.id;

    card.innerHTML = `
        <div class="balcao-card-header">
            <div class="balcao-card-cliente">${order.customerName || "Cliente não identificado"}</div>
            ${order.createdAt ? `<div class="balcao-card-time">${formatTime(order.createdAt)}</div>` : ""}
        </div>
        <div class="balcao-card-items">
            ${order.items.map((item) => `
                <div class="balcao-card-item">
                    <span>
                        <span class="balcao-card-item-quantidade">${item.quantity}x</span>
                        ${item.name}
                    </span>
                    <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join("")}
        </div>
        <div class="balcao-card-total">
            <strong>Total: R$ ${order.total.toFixed(2)}</strong>
        </div>
        <div class="balcao-card-actions">
            ${getBalcaoActionButtons(order)}
        </div>
    `;

    // Adicionar event listeners aos botões
    card.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", function () {
            const orderId = parseInt(this.dataset.id);
            const action = this.dataset.action;
            handleOrderAction(orderId, action);
        });
    });

    // Adicionar à coluna apropriada
    switch (order.status) {
        case "pending":
            atendimentoColumn.appendChild(card);
            break;
        case "preparing":
            preparandoColumn.appendChild(card);
            break;
        case "ready":
        case "delivered":
            prontoColumn.appendChild(card);
            break;
        default:
            if (order.paymentStatus === "pending") {
                prontoColumn.appendChild(card);
            }
            break;
    }
}

function getBalcaoActionButtons(order) {
    let buttons = "";
    
    if (order.status === "pending") {
        buttons += `<button class="btn btn-primary" data-id="${order.id}" data-action="start">Iniciar Preparo</button>`;
    }

    if (order.status === "preparing") {
        buttons += `<button class="btn btn-success" data-id="${order.id}" data-action="ready">Marcar Pronto</button>`;
    }

    if (order.status === "ready") {
        buttons += `<button class="btn btn-warning" data-id="${order.id}" data-action="deliver">Retirar Pedido</button>`;
    }

    if ((order.status === "delivered" || order.status === "ready") && order.paymentStatus === "pending") {
        buttons += `<button class="btn btn-info" data-id="${order.id}" data-action="pay">Processar Pagamento</button>`;
    }

    if (order.status === "delivered" && order.paymentStatus === "paid") {
        buttons += `<button class="btn btn-secondary" data-id="${order.id}" data-action="close">Fechar Pedido</button>`;
    }

    return buttons;
}

function addNewOrderCard(atendimentoColumn) {
    const novoPedidoCard = document.createElement("div");
    novoPedidoCard.className = "balcao-card new-order";
    
    novoPedidoCard.innerHTML = `
        <div class="cliente-nome">
            <strong>NOVO PEDIDO</strong>
            <input type="text" id="novo-cliente-balcao" placeholder="Nome do cliente" 
                   style="width: 100%; margin-top: 5px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
        </div>
        <div id="novo-pedido-itens" style="margin-bottom: 15px;">
            <div class="no-orders">Clique em "Criar Pedido"</div>
        </div>
        <button class="btn-criar-pedido" id="criar-pedido-balcao">
            CRIAR PEDIDO
        </button>
    `;
    
    atendimentoColumn.appendChild(novoPedidoCard);

    // Event listener para criar pedido
    const criarBtn = document.getElementById("criar-pedido-balcao");
    if (criarBtn) {
        criarBtn.addEventListener("click", criarPedidoBalcao);
    }
}

function addPlaceholders(atendimentoColumn, preparandoColumn, prontoColumn) {
    // Atendimento
    if (atendimentoColumn.children.length <= 1) { // 1 é o card de novo pedido
        const placeholder = document.createElement("div");
        placeholder.className = "no-orders";
        placeholder.textContent = "Nenhum pedido em atendimento";
        atendimentoColumn.insertBefore(placeholder, atendimentoColumn.firstChild);
    }

    // Preparando
    if (preparandoColumn.children.length === 0) {
        preparandoColumn.innerHTML = '<div class="no-orders">Nenhum pedido em preparação</div>';
    }

    // Pronto
    if (prontoColumn.children.length === 0) {
        prontoColumn.innerHTML = '<div class="no-orders">Nenhum pedido pronto</div>';
    }
}

function criarPedidoBalcao() {
    const clienteNome = document.getElementById("novo-cliente-balcao")?.value || "";

    // Configurar pedido atual
    currentOrder = {
        items: [],
        type: "counter",
        tableNumber: null,
        customerName: clienteNome,
    };

    // Mudar para PDV
    switchToTab("pdv");
    NotificationSystem.show(`Novo pedido iniciado para ${clienteNome || "cliente não identificado"}. Adicione itens no PDV.`, "success");
}

export async function handleOrderAction(orderId, action) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
        NotificationSystem.show("Pedido não encontrado", "error");
        return;
    }

    switch (action) {
        case "start":
            order.status = "preparing";
            order.updatedAt = new Date();
            NotificationSystem.show("Preparo iniciado!", "success");
            break;

        case "ready":
            order.status = "ready";
            order.updatedAt = new Date();
            NotificationSystem.show("Pedido marcado como pronto!", "success");
            break;

        case "deliver":
            order.status = "delivered";
            order.updatedAt = new Date();
            NotificationSystem.show("Pedido entregue!", "success");
            break;

        case "pay":
            if (!["caixa", "garcom"].includes(currentUser.profile)) {
                NotificationSystem.show("Apenas o caixa ou garçom podem processar pagamentos!", "error");
                return;
            }

            if (!["ready", "delivered"].includes(order.status) && order.paymentStatus !== "pending") {
                NotificationSystem.show("O pedido precisa estar pronto ou entregue para processar o pagamento!", "warning");
                return;
            }

            showPaymentModal(order);
            return;

        case "close":
            if (!["caixa", "garcom"].includes(currentUser.profile)) {
                NotificationSystem.show("Apenas o caixa ou garçom podem fechar pedidos!", "error");
                return;
            }

            const confirmed = await NotificationSystem.confirm("Deseja fechar este pedido?", "Fechar", "Cancelar");
            if (!confirmed) return;

            order.paymentStatus = "closed";
            order.updatedAt = new Date();
            NotificationSystem.show("Pedido fechado com sucesso!", "success");
            break;

        case "view":
            showOrderDetails(order);
            return;
    }

    DataManager.saveAppData();
    updateOrdersView();
    updateCozinhaView();
    updateDashboard();
}

function showOrderDetails(order) {
    const details = `
Detalhes do Pedido #${order.id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${order.type === "table" ? `Mesa: ${order.tableNumber}` : getOrderTypeText(order.type)}
${order.customerName ? `Cliente: ${order.customerName}` : ""}
${order.waiter ? `Garçom: ${order.waiter}` : ""}
${order.cashier ? `Caixa: ${order.cashier}` : ""}

ITENS:
${order.items.map((i) => `  ${i.quantity}x ${i.name} - R$ ${(i.price * i.quantity).toFixed(2)}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal: R$ ${order.subtotal.toFixed(2)}
Taxa de Serviço: R$ ${order.serviceTax.toFixed(2)}
TOTAL: R$ ${order.total.toFixed(2)}

Status: ${getStatusText(order.status)}
Pagamento: ${getPaymentStatusText(order.paymentStatus)}
Horário: ${formatTime(order.createdAt)}
    `;
    
    NotificationSystem.alert(details, `Pedido #${order.id}`);
}

// Função auxiliar para trocar de aba (importada de navigation)
function switchToTab(tabId) {
    const event = new CustomEvent('switchTab', { detail: { tabId } });
    window.dispatchEvent(event);
}