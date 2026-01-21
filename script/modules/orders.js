// ===========================
// ORDERS - Balcão e Pedidos (ATUALIZADO)
// ===========================

import { dataManager } from './dataManager.js';
import { NotificationSystem } from './notifications.js';
import { pdvManager } from './pdv.js';
import { navigationManager } from './navigation.js';
import { formatCurrency, formatTime } from '../utils/helpers.js';

/**
 * Gerenciador de pedidos (Balcão)
 */
export class OrdersManager {
    constructor() {
        this.initialized = false;
    }

    /**
     * Inicializa módulo de pedidos
     */
    initialize() {
        if (this.initialized) return;
        this.initialized = true;

        this.setupSearchFilter();
        this.updateView();
    }

    /**
     * Configura busca de pedidos
     */
    setupSearchFilter() {
        const searchInput = document.getElementById("search-order");
        if (searchInput) {
            searchInput.addEventListener("input", () => this.updateView());
        }
    }

    /**
     * Atualiza visualização do balcão
     */
    updateView() {
        const atendimentoColumn = document.getElementById("balcao-atendimento");
        const preparandoColumn = document.getElementById("balcao-preparando");
        const prontoColumn = document.getElementById("balcao-pronto");

        if (!atendimentoColumn || !preparandoColumn || !prontoColumn) return;

        atendimentoColumn.innerHTML = "";
        preparandoColumn.innerHTML = "";
        prontoColumn.innerHTML = "";

        const balcaoOrders = dataManager.orders.filter(
            order => order.type === "counter" && order.paymentStatus !== "closed"
        );

        balcaoOrders.forEach((order) => {
            const card = this.createOrderCard(order);

            switch (order.status) {
                case "pending":
                    atendimentoColumn.appendChild(card);
                    break;
                case "preparing":
                    preparandoColumn.appendChild(card);
                    break;
                case "ready":
                case "delivered":
                    if (order.paymentStatus === "pending") {
                        prontoColumn.appendChild(card);
                    }
                    break;
            }
        });

        // Card de novo pedido
        const novoPedidoCard = this.createNewOrderCard();
        atendimentoColumn.appendChild(novoPedidoCard);

        // Placeholders
        if (atendimentoColumn.children.length <= 1) {
            const placeholder = document.createElement("div");
            placeholder.className = "no-orders";
            placeholder.textContent = "Nenhum pedido em atendimento";
            atendimentoColumn.insertBefore(placeholder, novoPedidoCard);
        }

        if (preparandoColumn.children.length === 0) {
            preparandoColumn.innerHTML = '<div class="no-orders">Nenhum pedido em preparação</div>';
        }

        if (prontoColumn.children.length === 0) {
            prontoColumn.innerHTML = '<div class="no-orders">Nenhum pedido pronto</div>';
        }
    }

    /**
     * Cria card de pedido
     */
    createOrderCard(order) {
        const card = document.createElement("div");
        card.className = "balcao-card";

        card.innerHTML = `
            <div class="balcao-card-header">
                <div class="balcao-card-cliente">
                    ${order.customerName || "Cliente não identificado"}
                </div>
                ${order.createdAt ? `<div class="balcao-card-time">${formatTime(order.createdAt)}</div>` : ""}
            </div>
            <div class="balcao-card-items">
                ${order.items.map(item => `
                    <div class="balcao-card-item">
                        <span>
                            <span class="balcao-card-item-quantidade">${item.quantity}x</span>
                            ${item.name}
                        </span>
                        <span>${formatCurrency(item.price * item.quantity)}</span>
                    </div>
                `).join("")}
            </div>
            <div class="balcao-card-actions">
                ${this.getActionButtons(order)}
            </div>
        `;

        // Event listeners para botões
        card.querySelectorAll("button").forEach((btn) => {
            btn.addEventListener("click", () => {
                const orderId = parseInt(btn.getAttribute("data-id"));
                const action = btn.getAttribute("data-action");
                this.handleOrderAction(orderId, action);
            });
        });

        return card;
    }

    /**
     * Cria card de novo pedido
     */
    createNewOrderCard() {
        const card = document.createElement("div");
        card.className = "balcao-card";
        card.innerHTML = `
            <div class="balcao-card-header">
                <h4>Novo Pedido Balcão</h4>
            </div>
            <div class="balcao-card-items">
                <div class="form-group">
                    <label for="novo-cliente-balcao">Nome do Cliente (opcional):</label>
                    <input type="text" id="novo-cliente-balcao" class="form-control" placeholder="Ex: Cliente 1">
                </div>
            </div>
            <div class="balcao-card-actions">
                <button class="btn-criar-pedido" id="criar-pedido-balcao">
                    CRIAR PEDIDO
                </button>
            </div>
        `;

        const createBtn = card.querySelector("#criar-pedido-balcao");
        if (createBtn) {
            createBtn.addEventListener("click", () => this.createNewOrder());
        }

        return card;
    }

    /**
     * Obtém botões de ação baseado no status
     */
    getActionButtons(order) {
        let buttons = "";

        if (order.status === "pending") {
            buttons += `<button class="btn btn-primary" data-id="${order.id}" data-action="start">Iniciar Preparo</button>`;
        }

        if (order.status === "preparing") {
            buttons += `<button class="btn btn-success" data-id="${order.id}" data-action="ready">Marcar Pronto</button>`;
        }

        if (order.status === "ready") {
            buttons += `<button class="btn-retirar" data-id="${order.id}" data-action="deliver">Retirar Pedido</button>`;
        }

        if (order.status === "delivered" && order.paymentStatus === "pending") {
            buttons += `<button class="btn btn-info" data-id="${order.id}" data-action="pay">Processar Pagamento</button>`;
        }

        return buttons;
    }

    /**
     * Trata ações dos pedidos
     */
    handleOrderAction(orderId, action) {
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
                NotificationSystem.success("Pedido marcado como pronto!");
                break;

            case "deliver":
                order.status = "delivered";
                order.updatedAt = new Date();
                NotificationSystem.success("Pedido entregue!");
                break;

            case "pay":
                // Dispara evento para abrir modal de pagamento
                document.dispatchEvent(new CustomEvent('openPaymentModal', {
                    detail: { order }
                }));
                return;
        }

        dataManager.saveAppData();
        this.updateView();

        // Dispara evento de atualização
        document.dispatchEvent(new Event('ordersUpdated'));
    }

    /**
     * Cria novo pedido de balcão e redireciona para PDV
     */
    createNewOrder() {
        // Pega o nome do cliente do input
        const clienteNomeInput = document.getElementById("novo-cliente-balcao");
        const clienteNome = clienteNomeInput ? clienteNomeInput.value.trim() : "";
        
        // Limpa o input para uso futuro
        if (clienteNomeInput) {
            clienteNomeInput.value = "";
        }

        // 1. Redireciona para a aba PDV
        navigationManager.goToTab("pdv");
        
        // 2. Aguarda a aba carregar
        setTimeout(() => {
            if (pdvManager) {
                // 3. Configura pdvManager como pedido de balcão
                pdvManager.currentOrder.items = [];
                
                // Define os dados básicos do balcão
                pdvManager.setOrderData({
                    type: "counter",
                    tableNumber: null,
                    customerName: clienteNome || ""
                });
                
                // 4. Sincroniza campos visuais do PDV
                this.syncPDVInputsForCounter(clienteNome);
                
                // 5. Atualiza o resumo
                pdvManager.updateOrderSummary();
                
                console.log(`Novo pedido de balcão criado para: ${clienteNome || "Cliente não identificado"}`);
                NotificationSystem.success(`Novo pedido de balcão criado. Adicione itens no PDV.`);
            }
        }, 300);
    }

    /**
     * Sincroniza os inputs do PDV para pedido de balcão
     */
    syncPDVInputsForCounter(clienteNome) {
        const typeSelector = document.getElementById("pdv-type-selector");
        const tableInput = document.getElementById("pdv-table-input");
        const customerInput = document.getElementById("pdv-customer-input");
        
        if (typeSelector) {
            typeSelector.value = "counter";
            // Dispara o evento change para mostrar/esconder campos
            typeSelector.dispatchEvent(new Event('change'));
        }
        
        if (tableInput) {
            tableInput.style.display = "none";
            if (pdvManager) {
                pdvManager.currentOrder.tableNumber = null;
            }
        }
        
        if (customerInput) {
            customerInput.value = clienteNome || "";
            if (pdvManager) {
                pdvManager.currentOrder.customerName = clienteNome || "";
            }
        }
    }

    /**
     * Busca pedidos
     */
    searchOrders(searchTerm) {
        // Implementar busca se necessário
        this.updateView();
    }
}

// Exporta instância singleton
export const ordersManager = new OrdersManager();