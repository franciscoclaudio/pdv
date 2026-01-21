// ===========================
// MODALS - Modais do Sistema
// ===========================

import { dataManager } from './dataManager.js';
import { pdvManager } from './pdv.js';
import { NotificationSystem } from './notifications.js';
import { authManager } from './auth.js';
import { formatCurrency, calculateSubtotal, calculateServiceTax } from '../utils/helpers.js';
import { PAYMENT_METHODS, CONFIG } from '../utils/constants.js';
import { validatePayment } from '../utils/validators.js';

/**
 * Gerenciador de modais
 */
export class ModalsManager {
    constructor() {
        this.currentMesa = null;
        this.initialized = false;
    }

    /**
     * Inicializa modais
     */
    initialize() {
        if (this.initialized) return;
        this.initialized = true;
    
        console.log("🔧 ModalsManager inicializando...");
    
        this.initializeOrderModal();
        this.initializeMesaModal();
        this.initializePaymentModalListeners();
        
        // Escuta eventos customizados
        document.addEventListener('showMesaDetails', (e) => {
            console.log('📨 Evento showMesaDetails recebido no ModalsManager:', e.detail);
            if (e.detail && e.detail.mesa) {
                this.showMesaDetails(e.detail.mesa);
            } else if (e.detail && e.detail.mesaNumero) {
                // Se só tem o número, busca a mesa
                const mesa = dataManager.mesas.find(m => m.numero === e.detail.mesaNumero);
                if (mesa) {
                    this.showMesaDetails(mesa);
                }
            }
        });
        
        document.addEventListener('openPaymentModal', (e) => {
            console.log('Evento openPaymentModal recebido', e.detail);
            this.showPaymentModal(e.detail.order);
        });
    
        document.addEventListener('openOrderModal', () => {
            console.log('Evento openOrderModal recebido');
            this.showOrderModal();
        });
        
        console.log("✅ ModalsManager inicializado com sucesso");
        
        // Disponibiliza globalmente para debugging
        window.modalsManager = this;
    }

    /**
     * Inicializa modal de novo pedido
     */
    initializeOrderModal() {
        const modal = document.getElementById("order-modal");
        if (!modal) {
            console.warn("⚠️ Modal order-modal não encontrado");
            return;
        }

        const closeBtn = modal.querySelector(".close");
        const cancelBtn = document.getElementById("cancel-order");
        const confirmBtn = document.getElementById("confirm-order");
        const orderTypeSelect = document.getElementById("order-type");

        if (closeBtn) closeBtn.addEventListener("click", () => this.hideOrderModal());
        if (cancelBtn) cancelBtn.addEventListener("click", () => this.hideOrderModal());

        if (confirmBtn) {
            confirmBtn.addEventListener("click", () => {
                const orderType = document.getElementById("order-type").value;
                const tableNumber = document.getElementById("table-number").value;
                const customerName = document.getElementById("customer-name").value;

                pdvManager.setOrderData({
                    type: orderType,
                    tableNumber: orderType === "table" ? parseInt(tableNumber) : null,
                    customerName: customerName.trim()
                });

                this.hideOrderModal();
            });
        }

        if (orderTypeSelect) {
            orderTypeSelect.addEventListener("change", () => {
                const tableGroup = document.getElementById("table-number-group");
                if (tableGroup) {
                    tableGroup.style.display = orderTypeSelect.value === "table" ? "block" : "none";
                }
            });
        }

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                this.hideOrderModal();
            }
        });
    }

    /**
     * Inicializa modal de mesa
     */
    initializeMesaModal() {
        console.log("🔧 Inicializando modal de mesa...");
        
        // Tenta encontrar o modal
        let modal = document.getElementById("mesa-details-modal");
        
        if (!modal) {
            console.log("Procurando modal por classe...");
            modal = document.querySelector('.modal.mesa-modal') || document.querySelector('.mesa-modal');
        }
        
        if (!modal) {
            console.error("❌ Modal de mesa NÃO encontrado no DOM!");
            
            // Tenta criar o modal dinamicamente
            this.createMesaModal();
            return;
        }
        
        console.log("✅ Modal de mesa encontrado:", modal);

        const closeBtn = modal.querySelector(".close");
        const addItemBtn = document.getElementById("add-item-mesa");
        const fecharContaBtn = document.getElementById("fechar-conta-mesa");

        if (closeBtn) {
            console.log("✅ Botão close encontrado");
            closeBtn.addEventListener("click", () => this.hideMesaModal());
        } else {
            console.warn("⚠️ Botão close não encontrado");
        }

        if (addItemBtn) {
            console.log("✅ Botão add-item-mesa encontrado");
            addItemBtn.addEventListener("click", () => {
                this.addItemToMesa();
            });
        }

        if (fecharContaBtn) {
            console.log("✅ Botão fechar-conta-mesa encontrado");
            fecharContaBtn.addEventListener("click", () => this.fecharContaMesa());
        }

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                this.hideMesaModal();
            }
        });
        
        // Botão de salvar observações
        const salvarObservacoesBtn = document.getElementById("salvar-observacoes");
        if (salvarObservacoesBtn) {
            salvarObservacoesBtn.addEventListener("click", () => this.salvarObservacoes());
        }
        
        console.log("✅ Modal de mesa inicializado com sucesso");
    }

    /**
     * Cria modal de mesa dinamicamente se não existir
     */
    createMesaModal() {
        console.log("🔨 Criando modal de mesa dinamicamente...");
        
        const modalHTML = `
        <div class="modal" id="mesa-details-modal" style="display: none;">
            <div class="modal-content mesa-modal">
                <div class="modal-header">
                    <div class="header-content">
                        <div class="mesa-header-info">
                            <h3 id="mesa-modal-title">Mesa 0</h3>
                            <div class="mesa-status-badge" id="mesa-status-badge" style="background: #f39c12; color: white;">
                                <span class="status-icon">🕒</span>
                                <span class="status-text">Aguardando preparo</span>
                            </div>
                        </div>
                        <div class="mesa-info-details">
                            <div class="info-item">
                                <span class="info-label">Cliente:</span>
                                <span class="info-value" id="mesa-cliente-nome">Não informado</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Garçom:</span>
                                <span class="info-value" id="mesa-garcom">Não informado</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Tempo:</span>
                                <span class="info-value" id="mesa-tempo">0 min</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Pedido ID:</span>
                                <span class="info-value" id="mesa-pedido-id">#00000</span>
                            </div>
                        </div>
                    </div>
                    <span class="close">×</span>
                </div>
                
                <div class="modal-body">
                    <div class="mesa-section">
                        <h4 class="section-title">
                            <span class="title-icon">🍽️</span>
                            Itens do Pedido
                            <span class="items-count" id="mesa-items-count">(0 itens)</span>
                        </h4>
                        <div class="mesa-items-container">
                            <div class="mesa-items-list" id="mesa-items-list">
                                <div class="no-items-placeholder">
                                    <div class="placeholder-icon">📋</div>
                                    <p class="placeholder-text">Nenhum item no pedido</p>
                                    <p class="placeholder-subtext">Adicione itens usando o botão abaixo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mesa-section">
                        <h4 class="section-title">
                            <span class="title-icon">💰</span>
                            Resumo Financeiro
                        </h4>
                        <div class="mesa-financial-summary">
                            <div class="summary-line">
                                <span class="summary-label">Subtotal:</span>
                                <span class="summary-value" id="mesa-subtotal">R$ 0.00</span>
                            </div>
                            <div class="summary-line">
                                <span class="summary-label">Taxa de serviço (10%):</span>
                                <span class="summary-value" id="mesa-taxa-servico">R$ 0.00</span>
                            </div>
                            <div class="summary-line discount" style="display: none;">
                                <span class="summary-label">Desconto:</span>
                                <span class="summary-value" id="mesa-desconto">- R$ 0.00</span>
                            </div>
                            <div class="summary-line total">
                                <span class="summary-label"><strong>Total a pagar:</strong></span>
                                <span class="summary-value" id="mesa-total"><strong>R$ 0.00</strong></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mesa-section">
                        <h4 class="section-title">
                            <span class="title-icon">📝</span>
                            Observações
                        </h4>
                        <div class="mesa-observacoes">
                            <textarea 
                                id="mesa-observacoes-input" 
                                class="observacoes-textarea" 
                                placeholder="Adicione observações sobre o pedido (alergias, preferências, etc.)"
                                rows="3"
                            ></textarea>
                            <button class="btn-observacoes-save" id="salvar-observacoes">Salvar</button>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <div class="footer-actions">
                        <button type="button" class="btn btn-secondary" id="add-item-mesa">
                            <span class="btn-icon">➕</span>
                            Adicionar Item
                        </button>
                        <button type="button" class="btn btn-secondary" id="ver-comanda-mesa">
                            <span class="btn-icon">🧾</span>
                            Ver Comanda
                        </button>
                        <button type="button" class="btn btn-warning" id="aplicar-desconto-mesa">
                            <span class="btn-icon">🎁</span>
                            Aplicar Desconto
                        </button>
                        <button type="button" class="btn btn-primary" id="fechar-conta-mesa">
                            <span class="btn-icon">💳</span>
                            Fechar Conta
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        console.log("✅ Modal de mesa criado dinamicamente");
        
        // Re-inicializa o modal
        this.initializeMesaModal();
    }

    /**
     * Inicializa listeners do modal de pagamento
     */
    initializePaymentModalListeners() {
        // Será configurado dinamicamente
    }

    /**
     * Mostra modal de novo pedido
     */
    showOrderModal() {
        const modal = document.getElementById("order-modal");
        if (!modal) {
            console.error("Modal order-modal não encontrado");
            return;
        }

        const currentOrder = pdvManager.getCurrentOrder();

        document.getElementById("order-type").value = currentOrder.type || "table";
        document.getElementById("table-number").value = currentOrder.tableNumber || 1;
        document.getElementById("customer-name").value = "";

        const tableGroup = document.getElementById("table-number-group");
        if (tableGroup) {
            tableGroup.style.display = document.getElementById("order-type").value === "table" ? "block" : "none";
        }

        modal.classList.add("active");
    }

    /**
     * Esconde modal de novo pedido
     */
    hideOrderModal() {
        const modal = document.getElementById("order-modal");
        if (modal) {
            modal.classList.remove("active");
        }
    }

    /**
     * Mostra detalhes da mesa
     */
    showMesaDetails(mesa) {
        console.log("🔍 ModalsManager.showMesaDetails chamado com mesa:", mesa);
        
        if (!mesa) {
            console.error("❌ Mesa não fornecida!");
            NotificationSystem.error("Erro: Mesa não encontrada");
            return;
        }
        
        this.currentMesa = mesa;
    
        const modal = document.getElementById("mesa-details-modal");
        if (!modal) {
            console.error("❌ Modal mesa-details-modal não encontrado no DOM!");
            
            // Tenta criar o modal
            this.createMesaModal();
            
            // Aguarda e tenta novamente
            setTimeout(() => {
                this.showMesaDetails(mesa);
            }, 100);
            return;
        }
    
        const pedido = mesa.pedidoId 
            ? dataManager.orders.find(o => o.id === mesa.pedidoId) 
            : null;
        
        console.log("📦 Pedido encontrado:", pedido);
    
        // 1. Título da mesa
        const titleEl = document.getElementById("mesa-modal-title");
        if (titleEl) {
            titleEl.textContent = `Mesa ${mesa.numero}`;
            console.log(`✅ Título definido: Mesa ${mesa.numero}`);
        }
    
        // 2. Status da mesa
        const statusBadge = document.getElementById("mesa-status-badge");
        
        if (statusBadge && pedido) {
            const statusMap = {
                pending: { 
                    text: "🕒 Aguardando preparo", 
                    bgColor: "#f39c12",
                    icon: "🕒"
                },
                preparing: { 
                    text: "👨‍🍳 Em preparação", 
                    bgColor: "#3498db",
                    icon: "👨‍🍳"
                },
                ready: { 
                    text: "✅ Pronto para servir", 
                    bgColor: "#27ae60",
                    icon: "✅"
                },
                delivered: { 
                    text: "✓ Pedido entregue", 
                    bgColor: "#2ecc71",
                    icon: "✓"
                }
            };
    
            const status = statusMap[pedido.status] || { 
                text: "Mesa disponível", 
                bgColor: "#95a5a6",
                icon: "🪑"
            };
            
            statusBadge.style.background = status.bgColor;
            statusBadge.innerHTML = `<span class="status-icon">${status.icon}</span> <span class="status-text">${status.text}</span>`;
            
            console.log(`✅ Status definido: ${status.text}`);
        }
    
        // 3. Informações adicionais da mesa
        const clienteNomeEl = document.getElementById("mesa-cliente-nome");
        const garcomEl = document.getElementById("mesa-garcom");
        const tempoEl = document.getElementById("mesa-tempo");
        const pedidoIdEl = document.getElementById("mesa-pedido-id");
        
        if (pedido) {
            if (clienteNomeEl) {
                clienteNomeEl.textContent = pedido.customerName || "Não informado";
            }
            
            if (garcomEl) {
                garcomEl.textContent = pedido.waiter || "Não atribuído";
            }
            
            if (tempoEl && pedido.createdAt) {
                const agora = new Date();
                const criado = new Date(pedido.createdAt);
                const diffMin = Math.floor((agora - criado) / (1000 * 60));
                tempoEl.textContent = diffMin <= 0 ? "Agora" : `${diffMin} min`;
            }
            
            if (pedidoIdEl) {
                pedidoIdEl.textContent = `#${pedido.id}`;
            }
        } else {
            if (clienteNomeEl) clienteNomeEl.textContent = "Sem pedido";
            if (garcomEl) garcomEl.textContent = "N/A";
            if (tempoEl) tempoEl.textContent = "N/A";
            if (pedidoIdEl) pedidoIdEl.textContent = "N/A";
        }
    
        // 4. Lista de itens do pedido
        const itemsList = document.getElementById("mesa-items-list");
        const itemsCount = document.getElementById("mesa-items-count");
        
        if (itemsList) {
            itemsList.innerHTML = "";
            
            if (pedido && pedido.items && pedido.items.length > 0) {
                let totalItems = 0;
                
                pedido.items.forEach((item) => {
                    totalItems += item.quantity;
                    
                    const itemElement = document.createElement("div");
                    itemElement.className = "mesa-item";
                    itemElement.innerHTML = `
                        <div class="mesa-item-info">
                            <div class="mesa-item-name">${item.name}</div>
                            <div class="mesa-item-details">
                                <span class="mesa-item-quantity">${item.quantity}x</span>
                                <span class="mesa-item-unit-price">${formatCurrency(item.price)} un.</span>
                            </div>
                        </div>
                        <div class="mesa-item-price">${formatCurrency(item.price * item.quantity)}</div>
                    `;
                    itemsList.appendChild(itemElement);
                });
                
                // Atualiza contador de itens
                if (itemsCount) {
                    itemsCount.textContent = `(${totalItems} ${totalItems === 1 ? 'item' : 'itens'})`;
                }
                
                console.log(`✅ ${pedido.items.length} itens carregados (total: ${totalItems})`);
            } else {
                itemsList.innerHTML = `
                    <div class="no-items-placeholder">
                        <div class="placeholder-icon">📋</div>
                        <p class="placeholder-text">Nenhum item no pedido</p>
                        <p class="placeholder-subtext">Adicione itens usando o botão abaixo</p>
                    </div>
                `;
                
                if (itemsCount) {
                    itemsCount.textContent = "(0 itens)";
                }
                
                console.log("ℹ️ Nenhum item no pedido");
            }
        }
    
        // 5. Resumo financeiro
        const subtotal = pedido ? calculateSubtotal(pedido.items) : 0;
        const taxaServico = pedido ? calculateServiceTax(subtotal) : 0;
        const total = subtotal + taxaServico;
    
        const mesaSubtotalEl = document.getElementById("mesa-subtotal");
        const mesaTaxaEl = document.getElementById("mesa-taxa-servico");
        const mesaTotalEl = document.getElementById("mesa-total");
    
        if (mesaSubtotalEl) mesaSubtotalEl.textContent = formatCurrency(subtotal);
        if (mesaTaxaEl) mesaTaxaEl.textContent = formatCurrency(taxaServico);
        if (mesaTotalEl) mesaTotalEl.textContent = formatCurrency(total);
        
        console.log(`💰 Resumo financeiro: Subtotal ${formatCurrency(subtotal)}, Total ${formatCurrency(total)}`);
    
        // 6. Observações do pedido
        const observacoesInput = document.getElementById("mesa-observacoes-input");
        if (observacoesInput && pedido) {
            observacoesInput.value = pedido.observacoes || "";
        }
    
        // 7. Botão de aplicar desconto
        const descontoBtn = document.getElementById("aplicar-desconto-mesa");
        const descontoSection = document.querySelector(".summary-line.discount");
        
        if (descontoBtn && pedido) {
            descontoBtn.style.display = pedido.paymentStatus === "pending" ? "flex" : "none";
        }
        
        if (descontoSection && pedido && pedido.desconto && pedido.desconto > 0) {
            descontoSection.style.display = "flex";
            document.getElementById("mesa-desconto").textContent = `- ${formatCurrency(pedido.desconto)}`;
        } else if (descontoSection) {
            descontoSection.style.display = "none";
        }
    
        // 8. Mostra o modal
        modal.style.display = "flex";
        modal.classList.add("active");
        
        console.log("✅ Modal de mesa aberto com sucesso");
        
        // Dispara evento customizado para notificar que o modal foi aberto
        document.dispatchEvent(new CustomEvent('mesaModalOpened', {
            detail: { mesa, pedido }
        }));
    }

    /**
     * Esconde modal de mesa
     */
    hideMesaModal() {
        const modal = document.getElementById("mesa-details-modal");
        if (modal) {
            modal.style.display = "none";
            modal.classList.remove("active");
            console.log("✅ Modal de mesa fechado");
        }
        this.currentMesa = null;
        
        // Dispara evento customizado para notificar que o modal foi fechado
        document.dispatchEvent(new Event('mesaModalClosed'));
    }

    /**
     * Salva observações da mesa
     */
    salvarObservacoes() {
        if (!this.currentMesa || !this.currentMesa.pedidoId) return;
        
        const observacoesInput = document.getElementById("mesa-observacoes-input");
        const observacoes = observacoesInput ? observacoesInput.value.trim() : "";
        
        const pedido = dataManager.orders.find(o => o.id === this.currentMesa.pedidoId);
        if (pedido) {
            pedido.observacoes = observacoes;
            dataManager.saveAppData();
            NotificationSystem.success("Observações salvas com sucesso!");
        }
    }

    /**
     * Adiciona item à mesa
     */
    addItemToMesa() {
        if (!this.currentMesa) {
            NotificationSystem.error("Nenhuma mesa selecionada!");
            return;
        }
    
        const mesa = this.currentMesa;
        
        // Fecha a modal primeiro
        this.hideMesaModal();
        
        // Aguarda um pouco para garantir que o modal feche
        setTimeout(() => {
            // Redireciona para PDV
            document.dispatchEvent(new CustomEvent('redirectToPDVWithMesa', {
                detail: { 
                    mesaNumero: mesa.numero,
                    pedidoId: mesa.pedidoId || null
                }
            }));
            
            NotificationSystem.info(`Redirecionando para PDV com Mesa ${mesa.numero}`);
        }, 300);
    }

    /**
     * Fecha conta da mesa
     */
    fecharContaMesa() {
        if (!this.currentMesa) return;

        const pedido = this.currentMesa.pedidoId 
            ? dataManager.orders.find(o => o.id === this.currentMesa.pedidoId) 
            : null;

        if (!pedido) {
            NotificationSystem.error(`Nenhum pedido encontrado para a Mesa ${this.currentMesa.numero}!`);
            return;
        }

        if (!pedido.items || pedido.items.length === 0) {
            NotificationSystem.warning(`O pedido da Mesa ${this.currentMesa.numero} está vazio!`);
            return;
        }

        if (pedido.status !== "ready" && pedido.status !== "delivered") {
            NotificationSystem.confirm(
                `O pedido da Mesa ${this.currentMesa.numero} ainda não está pronto. Deseja marcar como pronto para pagamento?`,
                "Marcar como Pronto",
                "Aguardar"
            ).then((confirmado) => {
                if (confirmado) {
                    pedido.status = "ready";
                    dataManager.saveAppData();
                    this.processarPagamentoMesa(pedido);
                }
            });
        } else {
            this.processarPagamentoMesa(pedido);
        }
    }

    /**
     * Processa pagamento da mesa
     */
    processarPagamentoMesa(pedido) {
        this.hideMesaModal();
        setTimeout(() => {
            this.showPaymentModal(pedido);
        }, 300);
    }

    /**
     * Mostra modal de pagamento
     */
    showPaymentModal(order) {
        if (!order || !order.items || !Array.isArray(order.items)) {
            NotificationSystem.error("Pedido inválido");
            return;
        }

        const subtotal = calculateSubtotal(order.items);
        const serviceTax = calculateServiceTax(subtotal);
        const total = subtotal + serviceTax;

        const existingModal = document.getElementById("payment-modal-dynamic");
        if (existingModal) existingModal.remove();

        const modal = document.createElement("div");
        modal.className = "modal active";
        modal.id = "payment-modal-dynamic";
        modal.innerHTML = `
            <div class="modal-content payment-modal">
                <div class="modal-header">
                    <h3>Processar Pagamento - Pedido #${order.id}</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="payment-summary">
                        <h4>Resumo do Pedido</h4>
                        <div class="summary-line">
                            <span>Subtotal:</span>
                            <span>${formatCurrency(subtotal)}</span>
                        </div>
                        <div class="summary-line">
                            <span>Taxa de Serviço (10%):</span>
                            <span>${formatCurrency(serviceTax)}</span>
                        </div>
                        <div class="summary-line total">
                            <span><strong>Total a Pagar:</strong></span>
                            <span><strong>${formatCurrency(total)}</strong></span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="payment-method">Método de Pagamento:</label>
                        <select id="payment-method" class="form-control">
                            ${PAYMENT_METHODS.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-group" id="cash-group" style="display:none;">
                        <label for="amount-received">Valor Recebido:</label>
                        <input type="number" id="amount-received" class="form-control" step="0.01" min="${total}" value="${total}">
                        <div id="change-display" style="margin-top:10px; display:none;">
                            <strong>Troco:</strong> <span id="change-amount">R$ 0,00</span>
                        </div>
                    </div>

                    <div class="form-group" id="card-group" style="display:none;">
                        <label for="card-installments">Parcelas:</label>
                        <select id="card-installments" class="form-control">
                            <option value="1">À vista</option>
                            <option value="2">2x sem juros</option>
                            <option value="3">3x sem juros</option>
                            <option value="4">4x sem juros</option>
                            <option value="5">5x sem juros</option>
                            <option value="6">6x sem juros</option>
                        </select>
                        <div id="installment-value" style="margin-top:10px;"></div>
                    </div>

                    <div class="form-group" id="pix-group" style="display:none;">
                        <div style="text-align:center; padding:20px; background:#f8f9fa; border-radius:8px;">
                            <p><strong>Chave PIX:</strong></p>
                            <p style="font-size:1.2rem; font-weight:700; color:var(--primary-color);">restaurant@pix.com.br</p>
                            <p style="margin-top:15px; color:#666;">Aguardando confirmação do pagamento...</p>
                        </div>
                    </div>

                    <div class="form-group" id="voucher-group" style="display:none;">
                        <label for="voucher-code">Código do Vale:</label>
                        <input type="text" id="voucher-code" class="form-control" placeholder="Digite o código do vale">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancel-payment-dynamic">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="confirm-payment-dynamic">Confirmar Pagamento</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        this.setupPaymentModalEvents(modal, order, total);
    }

    /**
     * Configura eventos do modal de pagamento
     */
    setupPaymentModalEvents(modal, order, total) {
        const paymentMethodSelect = modal.querySelector("#payment-method");
        const amountReceivedInput = modal.querySelector("#amount-received");
        const changeDisplay = modal.querySelector("#change-display");
        const changeAmount = modal.querySelector("#change-amount");
        const cashGroup = modal.querySelector("#cash-group");
        const cardGroup = modal.querySelector("#card-group");
        const pixGroup = modal.querySelector("#pix-group");
        const voucherGroup = modal.querySelector("#voucher-group");
        const voucherCodeInput = modal.querySelector("#voucher-code");
        const closeBtn = modal.querySelector(".close");
        const cancelBtn = modal.querySelector("#cancel-payment-dynamic");
        const confirmBtn = modal.querySelector("#confirm-payment-dynamic");
        const cardInstallments = modal.querySelector("#card-installments");
        const installmentValue = modal.querySelector("#installment-value");

        const updatePaymentGroups = () => {
            const method = paymentMethodSelect.value;
            
            cashGroup.style.display = "none";
            cardGroup.style.display = "none";
            pixGroup.style.display = "none";
            voucherGroup.style.display = "none";

            if (method === "cash") {
                cashGroup.style.display = "block";
                if (amountReceivedInput) amountReceivedInput.value = total.toFixed(2);
            } else if (method === "card") {
                cardGroup.style.display = "block";
                updateInstallmentValue();
            } else if (method === "pix") {
                pixGroup.style.display = "block";
            } else if (method === "meal_voucher") {
                voucherGroup.style.display = "block";
            }
        };

        const updateInstallmentValue = () => {
            const installments = parseInt(cardInstallments.value);
            const valuePerInstallment = total / installments;
            if (installmentValue) {
                installmentValue.innerHTML = `<strong>Valor por parcela:</strong> ${formatCurrency(valuePerInstallment)}`;
            }
        };

        const calculateChange = () => {
            if (amountReceivedInput) {
                const received = parseFloat(amountReceivedInput.value) || 0;
                const change = Math.max(0, received - total);
                if (changeAmount) changeAmount.textContent = formatCurrency(change);
                if (changeDisplay) changeDisplay.style.display = change > 0 ? "block" : "none";
            }
        };

        const closeModal = () => {
            modal.classList.remove("active");
            setTimeout(() => modal.remove(), 300);
        };

        paymentMethodSelect.addEventListener("change", updatePaymentGroups);
        if (amountReceivedInput) amountReceivedInput.addEventListener("input", calculateChange);
        if (cardInstallments) cardInstallments.addEventListener("change", updateInstallmentValue);

        closeBtn.addEventListener("click", closeModal);
        cancelBtn.addEventListener("click", closeModal);

        confirmBtn.addEventListener("click", () => {
            this.processPayment(modal, order, total, closeModal);
        });

        updatePaymentGroups();
    }

    /**
     * Processa pagamento
     */
    processPayment(modal, order, total, closeModal) {
        const paymentMethod = modal.querySelector("#payment-method").value;
        const amountReceivedInput = modal.querySelector("#amount-received");
        const voucherCodeInput = modal.querySelector("#voucher-code");
        const cardInstallments = modal.querySelector("#card-installments");

        const amountReceived = parseFloat(amountReceivedInput?.value) || total;
        const voucherCode = voucherCodeInput ? voucherCodeInput.value.trim() : "";
        const installments = paymentMethod === "card" ? parseInt(cardInstallments.value) : 1;

        const paymentData = {
            method: paymentMethod,
            total: total,
            amountReceived: amountReceived,
            voucherCode: voucherCode
        };

        const validationErrors = validatePayment(paymentData);
        if (validationErrors.length > 0) {
            NotificationSystem.error(validationErrors[0]);
            return;
        }

        const orderToUpdate = dataManager.orders.find(o => o.id === order.id);
        if (!orderToUpdate) {
            NotificationSystem.error("Pedido não encontrado");
            closeModal();
            return;
        }

        orderToUpdate.paymentStatus = "paid";
        orderToUpdate.paymentMethod = paymentMethod;
        orderToUpdate.paymentDate = new Date();
        orderToUpdate.amountReceived = amountReceived;
        orderToUpdate.change = paymentMethod === "cash" ? Math.max(0, amountReceived - total) : 0;
        if (paymentMethod === "card") orderToUpdate.installments = installments;
        if (paymentMethod === "meal_voucher") orderToUpdate.voucherCode = voucherCode;

        if (orderToUpdate.type === "table" && orderToUpdate.tableNumber) {
            const mesa = dataManager.mesas.find(m => m.numero === orderToUpdate.tableNumber);
            if (mesa) {
                mesa.status = "limpando";
                mesa.pedidoId = null;

                setTimeout(() => {
                    mesa.status = "livre";
                    dataManager.saveAppData();
                    document.dispatchEvent(new Event('ordersUpdated'));
                }, CONFIG.CLEANING_TIMEOUT);
            }
            orderToUpdate.paymentStatus = "closed";
        }

        dataManager.saveAppData();

        const methodName = PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name || paymentMethod;
        let message = `✅ Pagamento processado com sucesso!\nPedido #${order.id} - ${formatCurrency(total)}\nMétodo: ${methodName}`;
        if (orderToUpdate.change > 0) message += `\nTroco: ${formatCurrency(orderToUpdate.change)}`;
        if (paymentMethod === "card" && installments > 1) message += `\nParcelado em ${installments}x de ${formatCurrency(total / installments)}`;

        NotificationSystem.success(message, 7000);

        // ✅ DISPARA EVENTO DE ATUALIZAÇÃO DO CAIXA
        document.dispatchEvent(new CustomEvent('caixaUpdated', {
            detail: {
                orderId: order.id,
                amount: total,
                method: paymentMethod,
                mesaNumber: orderToUpdate.tableNumber
            }
        }));
        
        document.dispatchEvent(new Event('ordersUpdated'));

        closeModal();
    }
}

// Exporta instância singleton
export const modalsManager = new ModalsManager();