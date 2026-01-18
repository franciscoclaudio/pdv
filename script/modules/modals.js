// script/modules/modals.js

import { currentOrder } from '../utils/constants.js';
import { switchToTab } from './navigation.js';
import { loadPDVProducts, updateOrderSummary } from './pdv.js';
import { NotificationSystem } from './notifications.js';

export function initializeModal() {
    const modal = document.getElementById("order-modal");
    if (!modal) return;

    const closeBtn = modal.querySelector(".close");
    const cancelBtn = document.getElementById("cancel-order");
    const confirmBtn = document.getElementById("confirm-order");
    const orderTypeSelect = document.getElementById("order-type");

    if (closeBtn) closeBtn.addEventListener("click", hideOrderModal);
    if (cancelBtn) cancelBtn.addEventListener("click", hideOrderModal);

    if (confirmBtn) {
        confirmBtn.addEventListener("click", function () {
            const orderType = document.getElementById("order-type").value;
            const tableNumber = document.getElementById("table-number").value;
            const customerName = document.getElementById("customer-name").value;

            currentOrder.type = orderType;
            currentOrder.tableNumber = orderType === "table" ? parseInt(tableNumber) : null;
            currentOrder.customerName = customerName.trim();

            hideOrderModal();
            switchToTab("pdv");
        });
    }

    if (orderTypeSelect) {
        orderTypeSelect.addEventListener("change", function () {
            const tableGroup = document.getElementById("table-number-group");
            if (tableGroup) {
                tableGroup.style.display = this.value === "table" ? "block" : "none";
            }
        });
    }

    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            hideOrderModal();
        }
    });
}

export function showOrderModal() {
    const modal = document.getElementById("order-modal");
    if (!modal) return;

    document.getElementById("order-type").value = "table";
    document.getElementById("table-number").value = currentOrder.tableNumber || 1;
    document.getElementById("customer-name").value = "";

    const tableGroup = document.getElementById("table-number-group");
    if (tableGroup) {
        tableGroup.style.display = "block";
    }

    modal.classList.add("active");
}

export function hideOrderModal() {
    const modal = document.getElementById("order-modal");
    if (modal) {
        modal.classList.remove("active");
    }
}

export function initializeMesaModal() {
    const modal = document.getElementById("mesa-details-modal");
    if (!modal) return;

    const closeBtn = modal.querySelector(".close");
    const addItemBtn = document.getElementById("add-item-mesa");
    const fecharContaBtn = document.getElementById("fechar-conta-mesa");
    const saveChangesBtn = document.getElementById("save-mesa-changes");

    if (closeBtn) closeBtn.addEventListener("click", hideMesaModal);

    if (addItemBtn) {
        addItemBtn.addEventListener("click", function () {
            if (!currentMesaModal) return;
            
            // 1. Fecha o modal da mesa
            hideMesaModal();
    
            // 2. Configura o pedido atual com os dados da mesa
            currentOrder.tableNumber = currentMesaModal.numero;
            currentOrder.type = "table";
    
            // 3. Força a troca de aba e a atualização visual do menu
            // Primeiro removemos a classe active de todos os itens de navegação
            document.querySelectorAll(".nav-item, .dropdown-item").forEach(nav => {
                nav.classList.remove("active");
            });
    
            // Adicionamos a classe active no item do menu que aponta para o PDV
            const pdvNavItem = document.querySelector('.nav-item[data-tab="pdv"], .dropdown-item[data-tab="pdv"]');
            if (pdvNavItem) {
                pdvNavItem.classList.add("active");
            }
    
            // Chama a função principal de troca
            switchToTab("pdv");
    
            // 4. Executa rotinas de interface com um pequeno delay para garantir o carregamento
            setTimeout(() => {
                // Garante que os produtos do PDV sejam carregados
                if (typeof loadPDVProducts === "function") loadPDVProducts();
                if (typeof updateOrderSummary === "function") updateOrderSummary();
                
                // Abre o modal de itens dentro da aba PDV
                showOrderModal();
    
                // Preenche o campo de mesa automaticamente
                const tableInput = document.getElementById("table-number");
                if (tableInput) {
                    tableInput.value = currentOrder.tableNumber;
                }
    
                NotificationSystem.show(`Mesa ${currentOrder.tableNumber} selecionada no PDV.`, "info");
            }, 150);
        });
    }

    if (fecharContaBtn) {
        fecharContaBtn.addEventListener("click", function () {
            if (currentMesaModal) {
                fecharContaMesa(currentMesaModal.numero);
            }
        });
    }

    if (saveChangesBtn) {
        saveChangesBtn.addEventListener("click", function () {
            NotificationSystem.show("Alterações salvas com sucesso!", "success");
            hideMesaModal();
            updateMesasView();
        });
    }

    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            hideMesaModal();
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && modal.classList.contains("active")) {
            hideMesaModal();
        }
    });
}

function showMesaDetails(mesaNumero) {
    const mesa = mesas.find((m) => m.numero === mesaNumero);
    if (!mesa) {
        NotificationSystem.show(`Mesa ${mesaNumero} não encontrada!`, "error");
        return;
    }

    currentMesaModal = mesa;

    const modal = document.getElementById("mesa-details-modal");
    const pedido = mesa.pedidoId ? orders.find((o) => o.id === mesa.pedidoId) : null;

    const titleEl = document.getElementById("mesa-modal-title");
    if (titleEl) titleEl.textContent = `Mesa ${mesa.numero}`;

    const statusInfo = document.getElementById("mesa-status-info");
    if (pedido) {
        if (pedido.status === "pending") {
            statusInfo.textContent = "🕐 Aguardando preparo";
            statusInfo.style.borderLeftColor = "#f39c12";
        } else if (pedido.status === "preparing") {
            statusInfo.textContent = "👨‍🍳 Em preparação";
            statusInfo.style.borderLeftColor = "#3498db";
        } else if (pedido.status === "ready") {
            statusInfo.textContent = "✅ Pronto para servir";
            statusInfo.style.borderLeftColor = "#27ae60";
        } else if (pedido.status === "delivered") {
            statusInfo.textContent = "✓ Pedido entregue";
            statusInfo.style.borderLeftColor = "#2ecc71";
        }
    } else {
        statusInfo.textContent = mesa.status === "limpando" ? "Mesa em limpeza" : "Mesa disponível";
        statusInfo.style.borderLeftColor = mesa.status === "limpando" ? "#f39c12" : "#95a5a6";
    }

    const itemsList = document.getElementById("mesa-items-list");
    if (!itemsList) return;
    itemsList.innerHTML = "";

    if (pedido && pedido.items && pedido.items.length > 0) {
        pedido.items.forEach((item) => {
            const itemElement = document.createElement("div");
            itemElement.className = "mesa-item";
            itemElement.innerHTML = `
                <div class="mesa-item-info">
                    <div class="mesa-item-name">${item.name}</div>
                    <div class="mesa-item-quantity">${item.quantity}x</div>
                </div>
                <div class="mesa-item-price">R$ ${(item.price * item.quantity).toFixed(2)}</div>
            `;
            itemsList.appendChild(itemElement);
        });
    } else {
        itemsList.innerHTML = `
            <div class="no-orders" style="text-align: center; padding: 30px;">
                <p>Nenhum item no pedido</p>
            </div>
        `;
    }

    const subtotal = pedido ? pedido.subtotal || (pedido.items.reduce((sum, item) => sum + item.price * item.quantity, 0)) : 0;
    const taxaServico = pedido ? pedido.serviceTax || subtotal * 0.1 : 0;
    const total = pedido ? pedido.total || subtotal + taxaServico : 0;

    const mesaSubtotalEl = document.getElementById("mesa-subtotal");
    const mesaTaxaEl = document.getElementById("mesa-taxa-servico");
    const mesaTotalEl = document.getElementById("mesa-total");

    if (mesaSubtotalEl) mesaSubtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    if (mesaTaxaEl) mesaTaxaEl.textContent = `R$ ${taxaServico.toFixed(2)}`;
    if (mesaTotalEl) mesaTotalEl.textContent = `R$ ${total.toFixed(2)}`;

    const garcomNameEl = document.getElementById("mesa-garcom-name");
    const garcomRoleEl = document.getElementById("mesa-garcom-role");
    const garcomAvatarEl = document.getElementById("mesa-garcom-avatar");

    if (garcomNameEl) garcomNameEl.textContent = pedido && pedido.waiter ? pedido.waiter : (currentUser ? currentUser.name : "—");
    if (garcomRoleEl) garcomRoleEl.textContent = currentUser ? getProfileDisplayName(currentUser.profile) : "—";
    if (garcomAvatarEl && currentUser) {
        const initials = (currentUser.name || "").split(" ").map(n => n[0]).join("").substring(0,2);
        garcomAvatarEl.textContent = initials;
    }

    const footer = modal.querySelector(".modal-footer");
    const existingFinalizeBtn = footer.querySelector("#finalize-cleaning-btn");
    if (existingFinalizeBtn) existingFinalizeBtn.remove();

    if (mesa.status === "limpando" && hasAtendimentoPermission()) {
        const finalizeBtn = document.createElement("button");
        finalizeBtn.id = "finalize-cleaning-btn";
        finalizeBtn.className = "btn btn-primary";
        finalizeBtn.textContent = "Finalizar Limpeza";
        finalizeBtn.addEventListener("click", function () {
            NotificationSystem.confirm(`Finalizar limpeza da Mesa ${mesa.numero}?`, "Finalizar", "Cancelar").then((ok) => {
                if (ok) {
                    mesa.status = "livre";
                    DataManager.saveAppData();
                    updateMesasView();
                    hideMesaModal();
                    NotificationSystem.show(`Limpeza da Mesa ${mesa.numero} finalizada.`, "success");
                }
            });
        });
        footer.insertBefore(finalizeBtn, footer.firstChild);
    }

    modal.classList.add("active");
}

export function showPaymentModal(order) {
    if (!order || !order.items || !Array.isArray(order.items)) {
        NotificationSystem.show("Pedido inválido", "error");
        return;
    }

    const subtotal = order.subtotal || order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const serviceTax = order.serviceTax || subtotal * 0.1;
    const total = order.total || subtotal + serviceTax;

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
                        <span>R$ ${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="summary-line">
                        <span>Taxa de Serviço (10%):</span>
                        <span>R$ ${serviceTax.toFixed(2)}</span>
                    </div>
                    <div class="summary-line total">
                        <span><strong>Total a Pagar:</strong></span>
                        <span><strong>R$ ${total.toFixed(2)}</strong></span>
                    </div>
                </div>

                <div class="form-group">
                    <label for="payment-method">Método de Pagamento:</label>
                    <select id="payment-method" class="form-control">
                        ${paymentMethods.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
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

    function updatePaymentGroups() {
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
    }

    function updateInstallmentValue() {
        const installments = parseInt(cardInstallments.value);
        const valuePerInstallment = total / installments;
        if (installmentValue) {
            installmentValue.innerHTML = `<strong>Valor por parcela:</strong> R$ ${valuePerInstallment.toFixed(2)}`;
        }
    }

    function calculateChange() {
        if (amountReceivedInput) {
            const received = parseFloat(amountReceivedInput.value) || 0;
            const change = Math.max(0, received - total);
            if (changeAmount) changeAmount.textContent = `R$ ${change.toFixed(2)}`;
            if (changeDisplay) changeDisplay.style.display = change > 0 ? "block" : "none";
        }
    }

    function validatePayment() {
        const errors = [];
        const method = paymentMethodSelect.value;

        if (method === "cash") {
            const received = parseFloat(amountReceivedInput.value) || 0;
            if (received < total) {
                errors.push("Valor recebido é menor que o total!");
            }
        }

        if (method === "meal_voucher") {
            const code = voucherCodeInput.value.trim();
            if (!code) {
                errors.push("Digite o código do vale!");
            }
        }

        return errors;
    }

    paymentMethodSelect.addEventListener("change", updatePaymentGroups);
    if (amountReceivedInput) amountReceivedInput.addEventListener("input", calculateChange);
    if (cardInstallments) cardInstallments.addEventListener("change", updateInstallmentValue);

    closeBtn.addEventListener("click", () => {
        modal.classList.remove("active");
        setTimeout(() => modal.remove(), 300);
    });

    cancelBtn.addEventListener("click", () => {
        modal.classList.remove("active");
        setTimeout(() => modal.remove(), 300);
    });

    confirmBtn.addEventListener("click", function () {
        const validationErrors = validatePayment();
        if (validationErrors.length > 0) {
            NotificationSystem.show(validationErrors[0], "error");
            return;
        }

        const paymentMethod = paymentMethodSelect.value;
        const amountReceived = parseFloat(amountReceivedInput?.value) || total;
        const voucherCode = voucherCodeInput ? voucherCodeInput.value.trim() : "";
        const installments = paymentMethod === "card" ? parseInt(cardInstallments.value) : 1;

        const orderToUpdate = orders.find((o) => o.id === order.id);
        if (!orderToUpdate) {
            NotificationSystem.show("Pedido não encontrado", "error");
            modal.classList.remove("active");
            setTimeout(() => modal.remove(), 300);
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
            const mesa = mesas.find((m) => m.numero === orderToUpdate.tableNumber);
            if (mesa) {
                mesa.status = "limpando";
                mesa.pedidoId = null;

                setTimeout(() => {
                    mesa.status = "livre";
                    updateMesasView();
                    DataManager.saveAppData();
                }, 30000);
            }
            orderToUpdate.paymentStatus = "closed";
        }

        DataManager.saveAppData();

        const methodName = paymentMethods.find((m) => m.id === paymentMethod)?.name || paymentMethod;
        let message = `✅ Pagamento processado com sucesso!\nPedido #${order.id} - R$ ${total.toFixed(2)}\nMétodo: ${methodName}`;
        if (orderToUpdate.change > 0) message += `\nTroco: R$ ${orderToUpdate.change.toFixed(2)}`;
        if (paymentMethod === "card" && installments > 1) message += `\nParcelado em ${installments}x de R$ ${(total / installments).toFixed(2)}`;

        NotificationSystem.show(message, "success", 7000);

        updateOrdersView();
        updateMesasView();
        updateDashboard();
        updateCozinhaView();

        modal.classList.remove("active");
        setTimeout(() => modal.remove(), 300);
    });

    updatePaymentGroups();
}