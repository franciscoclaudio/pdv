// ===========================
// DELIVERY - Gerenciamento de Delivery (COMPLETO)
// ===========================

import { dataManager } from './dataManager.js';
import { NotificationSystem } from './notifications.js';
import { authManager } from './auth.js';
import { formatCurrency, formatDateTime } from '../utils/helpers.js';
import { ORDER_STATUS } from '../utils/constants.js';

/**
 * Gerenciador de Delivery
 */
export class DeliveryManager {
    constructor() {
        this.initialized = false;
        this.currentFilter = 'all';
        this.ordersCache = [];
    }

    /**
     * Inicializa o módulo de Delivery
     */
    initialize() {
        if (this.initialized) return;
        this.initialized = true;

        this.setupEventListeners();
        this.setupSearch();
        this.updateView();
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Evento de atualização quando pedido é criado
        document.addEventListener('ordersUpdated', () => {
            this.refreshOrdersCache();
            this.updateView();
        });

        // Evento de atualização quando dados são importados
        document.addEventListener('dataImported', () => {
            this.refreshOrdersCache();
            this.updateView();
        });
    }

    /**
     * Configura a busca de pedidos
     */
    setupSearch() {
        const searchInput = document.getElementById('search-delivery');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                this.filterOrders(term);
            });
        }
    }

    /**
     * Filtra pedidos por termo de busca
     */
    filterOrders(searchTerm) {
        const filtered = searchTerm 
            ? this.ordersCache.filter(order => 
                (order.id.toString().includes(searchTerm)) ||
                (order.customerName && order.customerName.toLowerCase().includes(searchTerm)) ||
                (order.phone && order.phone.toLowerCase().includes(searchTerm))
            )
            : this.ordersCache;
        
        this.renderOrders(filtered);
    }

    /**
     * Atualiza o cache de pedidos
     */
    refreshOrdersCache() {
        // Filtra apenas pedidos do tipo delivery
        this.ordersCache = dataManager.orders
            .filter(order => order.type === 'delivery')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Atualiza a visualização
     */
    updateView() {
        this.refreshOrdersCache();
        this.updateStats();
        this.updatePendingPayments();
        this.renderOrders(this.ordersCache);
    }

    /**
     * Atualiza estatísticas
     */
    updateStats() {
        const total = this.ordersCache.length;
        const pending = this.ordersCache.filter(o => o.status === 'pending').length;
        const enroute = this.ordersCache.filter(o => o.status === 'enroute').length;
        const delivered = this.ordersCache.filter(o => o.status === 'delivered').length;

        document.getElementById('delivery-total-count').textContent = total;
        document.getElementById('delivery-pending-count').textContent = pending;
        document.getElementById('delivery-enroute-count').textContent = enroute;
        document.getElementById('delivery-delivered-count').textContent = delivered;
    }

    /**
     * Atualiza pedidos pendentes de pagamento
     */
    updatePendingPayments() {
        const container = document.getElementById('delivery-pending-payments');
        if (!container) return;

        const pendingPayments = this.ordersCache.filter(order => 
            order.paymentStatus === 'pending' && 
            order.status !== 'delivered'
        );

        if (pendingPayments.length === 0) {
            container.innerHTML = '<div class="no-orders">Nenhum pedido pendente de pagamento</div>';
            return;
        }

        container.innerHTML = pendingPayments.map(order => {
            const paymentMethodText = this.getPaymentMethodText(order.paymentMethod);
            const changeText = order.change > 0 ? ` – Troco para ${formatCurrency(order.change)}` : '';
            
            return `
                <div class="delivery-payment-card" data-order-id="${order.id}">
                    <div class="payment-card-header">
                        <span class="order-id">Pedido #${order.id}</span>
                        <span class="payment-status ${order.paymentStatus}">${order.paymentStatus === 'pending' ? 'Pendente' : 'Pago'}</span>
                    </div>
                    <div class="payment-card-body">
                        <p><strong>Cliente:</strong> ${order.customerName || 'Não informado'}</p>
                        <p><strong>Pagamento:</strong> ${paymentMethodText}${changeText}</p>
                        <p><strong>Total:</strong> ${formatCurrency(order.total || 0)}</p>
                        <p><strong>Endereço:</strong> ${order.address || 'Não informado'}</p>
                    </div>
                    <div class="payment-card-actions">
                        <button class="btn btn-sm btn-primary mark-as-paid" data-order-id="${order.id}">
                            Marcar como Pago
                        </button>
                        <button class="btn btn-sm btn-secondary view-order" data-order-id="${order.id}">
                            Ver Detalhes
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Adiciona eventos aos botões
        container.querySelectorAll('.mark-as-paid').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const orderId = parseInt(btn.getAttribute('data-order-id'));
                this.markAsPaid(orderId);
            });
        });

        container.querySelectorAll('.view-order').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const orderId = parseInt(btn.getAttribute('data-order-id'));
                this.showOrderDetails(orderId);
            });
        });
    }

    /**
     * Renderiza os pedidos no kanban
     */
    renderOrders(orders) {
        const containers = {
            pending: document.getElementById('delivery-pending'),
            preparing: document.getElementById('delivery-preparing'),
            enroute: document.getElementById('delivery-enroute'),
            delivered: document.getElementById('delivery-delivered')
        };

        // Limpa todos os containers
        Object.values(containers).forEach(container => {
            if (container) container.innerHTML = '';
        });

        if (orders.length === 0) {
            Object.values(containers).forEach(container => {
                if (container) {
                    container.innerHTML = '<div class="no-orders">Nenhum pedido</div>';
                }
            });
            return;
        }

        // Agrupa pedidos por status
        const grouped = {
            pending: orders.filter(o => o.status === 'pending'),
            preparing: orders.filter(o => o.status === 'preparing'),
            enroute: orders.filter(o => o.status === 'enroute'),
            delivered: orders.filter(o => o.status === 'delivered' || o.status === 'delivered')
        };

        // Renderiza cada grupo
        Object.keys(grouped).forEach(status => {
            const container = containers[status];
            if (!container) return;

            const groupOrders = grouped[status];
            
            if (groupOrders.length === 0) {
                container.innerHTML = '<div class="no-orders">Nenhum pedido</div>';
                return;
            }

            groupOrders.forEach(order => {
                const card = this.createOrderCard(order);
                container.appendChild(card);
            });
        });
    }

    /**
     * Cria card de pedido
     */
    createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'delivery-order-card';
        card.setAttribute('data-order-id', order.id);
        
        const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const timeAgo = this.getTimeAgo(order.createdAt);
        const statusClass = this.getStatusClass(order.status);
        
        card.innerHTML = `
            <div class="delivery-card-header">
                <div class="delivery-order-id">Pedido #${order.id}</div>
                <div class="delivery-status ${statusClass}">${this.getStatusText(order.status)}</div>
            </div>
            <div class="delivery-card-body">
                <div class="delivery-customer">
                    <strong>${order.customerName || 'Cliente não informado'}</strong>
                    <br>
                    <small>${order.phone || 'Sem telefone'}</small>
                </div>
                <div class="delivery-address">
                    <span class="address-icon">📍</span>
                    ${order.address ? order.address.substring(0, 40) + (order.address.length > 40 ? '...' : '') : 'Endereço não informado'}
                </div>
                <div class="delivery-info">
                    <div class="info-item">
                        <span class="info-label">Itens:</span>
                        <span class="info-value">${itemsCount}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total:</span>
                        <span class="info-value">${formatCurrency(order.total || 0)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Pedido:</span>
                        <span class="info-value">${timeAgo}</span>
                    </div>
                </div>
                <div class="delivery-items-preview">
                    ${order.items.slice(0, 2).map(item => 
                        `<span class="item-tag">${item.quantity}x ${item.name.substring(0, 15)}</span>`
                    ).join('')}
                    ${order.items.length > 2 ? `<span class="item-tag">+${order.items.length - 2} mais</span>` : ''}
                </div>
            </div>
            <div class="delivery-card-actions">
                ${this.getActionButtons(order)}
            </div>
        `;

        // Adiciona eventos
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-action')) {
                this.showOrderDetails(order.id);
            }
        });

        // Adiciona eventos aos botões de ação
        card.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                const orderId = parseInt(btn.getAttribute('data-order-id'));
                this.handleAction(action, orderId);
            });
        });

        return card;
    }

    /**
     * Obtém botões de ação baseados no status
     */
    getActionButtons(order) {
        const buttons = [];
        const orderId = order.id;

        switch (order.status) {
            case 'pending':
                buttons.push(`
                    <button class="btn btn-sm btn-success btn-action" 
                            data-action="start_preparing" 
                            data-order-id="${orderId}">
                        Iniciar Preparo
                    </button>
                `);
                break;
                
            case 'preparing':
                buttons.push(`
                    <button class="btn btn-sm btn-primary btn-action" 
                            data-action="mark_enroute" 
                            data-order-id="${orderId}">
                        Saiu para Entrega
                    </button>
                `);
                break;
                
            case 'enroute':
                buttons.push(`
                    <button class="btn btn-sm btn-success btn-action" 
                            data-action="mark_delivered" 
                            data-order-id="${orderId}">
                        Entregue
                    </button>
                    <button class="btn btn-sm btn-warning btn-action" 
                            data-action="mark_problem" 
                            data-order-id="${orderId}">
                        Problema
                    </button>
                `);
                break;
                
            case 'delivered':
                if (order.paymentStatus === 'pending') {
                    buttons.push(`
                        <button class="btn btn-sm btn-primary btn-action" 
                                data-action="mark_paid" 
                                data-order-id="${orderId}">
                            Marcar como Pago
                        </button>
                    `);
                }
                break;
        }

        buttons.push(`
            <button class="btn btn-sm btn-secondary btn-action" 
                    data-action="view_details" 
                    data-order-id="${orderId}">
                Detalhes
            </button>
        `);

        return buttons.join('');
    }

    /**
     * Manipula ações dos botões
     */
    handleAction(action, orderId) {
        const order = dataManager.orders.find(o => o.id === orderId);
        if (!order) return;

        switch (action) {
            case 'start_preparing':
                this.updateOrderStatus(orderId, 'preparing');
                break;
                
            case 'mark_enroute':
                this.updateOrderStatus(orderId, 'enroute');
                break;
                
            case 'mark_delivered':
                this.updateOrderStatus(orderId, 'delivered');
                break;
                
            case 'mark_paid':
                this.markAsPaid(orderId);
                break;
                
            case 'mark_problem':
                this.reportProblem(orderId);
                break;
                
            case 'view_details':
                this.showOrderDetails(orderId);
                break;
        }
    }

    /**
     * Atualiza status do pedido
     */
    updateOrderStatus(orderId, newStatus) {
        const order = dataManager.orders.find(o => o.id === orderId);
        if (!order) {
            NotificationSystem.error('Pedido não encontrado!');
            return;
        }

        const oldStatus = order.status;
        order.status = newStatus;
        order.updatedAt = new Date();
        
        dataManager.saveAppData();
        
        NotificationSystem.success(`Pedido #${orderId} atualizado: ${this.getStatusText(oldStatus)} → ${this.getStatusText(newStatus)}`);
        
        // Atualiza a view
        this.updateView();
        document.dispatchEvent(new Event('ordersUpdated'));
    }

    /**
     * Marca pedido como pago
     */
    markAsPaid(orderId) {
        const order = dataManager.orders.find(o => o.id === orderId);
        if (!order) return;

        if (order.paymentStatus === 'paid') {
            NotificationSystem.info('Pedido já está marcado como pago!');
            return;
        }

        NotificationSystem.confirm(
            `Deseja marcar o pedido #${orderId} como pago?`,
            'Marcar como Pago',
            'Cancelar'
        ).then(confirmed => {
            if (confirmed) {
                order.paymentStatus = 'paid';
                order.paymentDate = new Date();
                order.updatedAt = new Date();
                
                dataManager.saveAppData();
                
                NotificationSystem.success(`Pedido #${orderId} marcado como pago!`);
                
                // Atualiza a view
                this.updateView();
                document.dispatchEvent(new Event('ordersUpdated'));
                
                // Dispara evento de atualização do caixa
                document.dispatchEvent(new CustomEvent('caixaUpdated', {
                    detail: {
                        orderId: orderId,
                        amount: order.total,
                        method: order.paymentMethod
                    }
                }));
            }
        });
    }

    /**
     * Reporta problema no delivery
     */
    reportProblem(orderId) {
        NotificationSystem.prompt(
            'Descreva o problema:',
            'Problema no Delivery',
            'Cancelar',
            'Salvar'
        ).then(problem => {
            if (problem) {
                const order = dataManager.orders.find(o => o.id === orderId);
                if (order) {
                    order.problem = problem;
                    order.updatedAt = new Date();
                    dataManager.saveAppData();
                    
                    NotificationSystem.warning(`Problema registrado no pedido #${orderId}`);
                    this.updateView();
                }
            }
        });
    }

    /**
     * Mostra detalhes do pedido
     */
    showOrderDetails(orderId) {
        const order = dataManager.orders.find(o => o.id === orderId);
        if (!order) {
            NotificationSystem.error('Pedido não encontrado!');
            return;
        }

        const itemsList = order.items.map(item => 
            `${item.quantity}x ${item.name} - ${formatCurrency(item.price * item.quantity)}`
        ).join('\n');
        
        const details = `
            📦 Pedido #${order.id}
            👤 Cliente: ${order.customerName || 'Não informado'}
            📞 Telefone: ${order.phone || 'Não informado'}
            📍 Endereço: ${order.address || 'Não informado'}
            🕒 Pedido: ${formatDateTime(order.createdAt)}
            📊 Status: ${this.getStatusText(order.status)}
            💰 Pagamento: ${this.getPaymentMethodText(order.paymentMethod)} (${order.paymentStatus === 'paid' ? 'Pago' : 'Pendente'})
            
            🛒 Itens:
            ${itemsList}
            
            💸 Subtotal: ${formatCurrency(order.subtotal || 0)}
            📋 Taxa (10%): ${formatCurrency(order.serviceTax || 0)}
            💰 Total: ${formatCurrency(order.total || 0)}
            
            ${order.observacoes ? `📝 Observações: ${order.observacoes}` : ''}
            ${order.problem ? `⚠️ Problema: ${order.problem}` : ''}
        `;

        NotificationSystem.alert(details, `Detalhes do Pedido #${order.id}`, 'Fechar');
    }

    /**
     * Obtém texto do status
     */
    getStatusText(status) {
        const statusMap = {
            'pending': 'Pendente',
            'preparing': 'Preparando',
            'enroute': 'Em Rota',
            'delivered': 'Entregue'
        };
        return statusMap[status] || status;
    }

    /**
     * Obtém classe CSS para status
     */
    getStatusClass(status) {
        const classMap = {
            'pending': 'status-pending',
            'preparing': 'status-preparing',
            'enroute': 'status-enroute',
            'delivered': 'status-delivered'
        };
        return classMap[status] || '';
    }

    /**
     * Obtém texto do método de pagamento
     */
    getPaymentMethodText(method) {
        const methodMap = {
            'cash': 'Dinheiro',
            'card': 'Cartão',
            'pix': 'PIX',
            'meal_voucher': 'Vale Refeição'
        };
        return methodMap[method] || method || 'Não informado';
    }

    /**
     * Calcula tempo decorrido
     */
    getTimeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays > 0) return `${diffDays}d atrás`;
        if (diffHours > 0) return `${diffHours}h atrás`;
        if (diffMins > 0) return `${diffMins}min atrás`;
        return 'Agora';
    }

    /**
     * Adiciona pedido de delivery via PDV
     */
    addDeliveryOrder(orderData) {
        const deliveryOrder = {
            ...orderData,
            type: 'delivery',
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        dataManager.orders.push(deliveryOrder);
        dataManager.saveAppData();

        NotificationSystem.success(`Pedido delivery #${deliveryOrder.id} criado!`);
        
        // Atualiza a view
        this.updateView();
        document.dispatchEvent(new CustomEvent('orderCreated', {
            detail: { order: deliveryOrder }
        }));

        return deliveryOrder;
    }
}

// Exporta instância singleton
export const deliveryManager = new DeliveryManager();