// script/modules/pdv.js

import { products, currentOrder, inventory, orders, mesas } from '../utils/constants.js';
import { DataManager } from './dataManager.js';
import { NotificationSystem } from './notifications.js';
import { DataValidator } from '../utils/validators.js';
import { generateOrderId } from '../utils/helpers.js';
import { showOrderModal, hideOrderModal } from './modals.js';
import { updateOrdersView } from './orders.js';
import { updateCozinhaView } from './kitchen.js';
import { updateDashboard } from './dashboard.js';
import { updateMesasView } from './tables.js';

export function initializePDV() {
    if (window.pdvInitialized) return;
    window.pdvInitialized = true;

    const novoPedidoBtn = document.getElementById("pdv-novo-pedido");
    const categoryButtons = document.querySelectorAll("#pdv .category-btn");
    const clearOrderBtn = document.getElementById("clear-order");
    const finalizeOrderBtn = document.getElementById("finalize-order");

    if (novoPedidoBtn) {
        novoPedidoBtn.addEventListener("click", showOrderModal);
    }

    if (categoryButtons && categoryButtons.length > 0) {
        categoryButtons.forEach((btn) => {
            btn.addEventListener("click", function () {
                categoryButtons.forEach((b) => b.classList.remove("active"));
                this.classList.add("active");

                const category = this.textContent.trim();
                loadPDVProducts(category === "Todos" ? null : category);
            });
        });
    }

    if (clearOrderBtn) clearOrderBtn.addEventListener("click", clearOrder);
    if (finalizeOrderBtn) finalizeOrderBtn.addEventListener("click", finalizeOrder);
}

export function loadPDVProducts(category = null) {
    const productsGrid = document.querySelector("#pdv .products-grid");
    if (!productsGrid) return;

    productsGrid.innerHTML = "";

    const filteredProducts = category
        ? products.filter((p) => p.category === category)
        : products;

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<div class="no-orders">Nenhum produto encontrado</div>';
        return;
    }

    filteredProducts.forEach((product) => {
        const productElement = document.createElement("div");
        productElement.className = "product-item";
        productElement.innerHTML = `
            <div class="product-image">${product.image}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">R$ ${product.price.toFixed(2)}</div>
        `;

        productElement.addEventListener("click", () => {
            addToOrder(product);
        });

        productsGrid.appendChild(productElement);
    });
}

export function updateOrderSummary() {
    const orderItems = document.getElementById("current-order-items");
    const subtotalElement = document.getElementById("subtotal");
    const serviceTaxElement = document.getElementById("service-tax");
    const totalElement = document.getElementById("total");

    if (!orderItems) return;

    orderItems.innerHTML = "";

    if (currentOrder.items.length === 0) {
        orderItems.innerHTML = '<div class="no-orders">Nenhum item no pedido</div>';
        if (subtotalElement) subtotalElement.textContent = "R$ 0,00";
        if (serviceTaxElement) serviceTaxElement.textContent = "R$ 0,00";
        if (totalElement) totalElement.textContent = "R$ 0,00";
        return;
    }

    let subtotal = 0;

    currentOrder.items.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const itemElement = document.createElement("div");
        itemElement.className = "order-item";
        itemElement.innerHTML = `
            <div class="order-item-info">
                <div class="order-item-name">${item.name}</div>
                <div class="order-item-price">R$ ${item.price.toFixed(2)}</div>
            </div>
            <div class="order-item-controls">
                <button class="quantity-btn minus" data-id="${item.productId}">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn plus" data-id="${item.productId}">+</button>
            </div>
            <div class="order-item-total">R$ ${itemTotal.toFixed(2)}</div>
        `;

        orderItems.appendChild(itemElement);
    });

    orderItems.querySelectorAll(".quantity-btn.minus").forEach((btn) => {
        btn.addEventListener("click", function () {
            const productId = parseInt(this.getAttribute("data-id"));
            decreaseQuantity(productId);
        });
    });

    orderItems.querySelectorAll(".quantity-btn.plus").forEach((btn) => {
        btn.addEventListener("click", function () {
            const productId = parseInt(this.getAttribute("data-id"));
            increaseQuantity(productId);
        });
    });

    const serviceTax = subtotal * 0.1;
    const total = subtotal + serviceTax;

    if (subtotalElement) subtotalElement.textContent = `R$ ${subtotal.toFixed(2)}`;
    if (serviceTaxElement) serviceTaxElement.textContent = `R$ ${serviceTax.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `R$ ${total.toFixed(2)}`;
}

export function clearOrder() {
    if (currentOrder.items.length === 0) return;

    NotificationSystem.confirm("Deseja realmente limpar o pedido atual?", "Limpar", "Cancelar").then((confirmed) => {
        if (confirmed) {
            currentOrder.items = [];
            updateOrderSummary();
            NotificationSystem.show("Pedido limpo com sucesso!", "success");
        }
    });
}

export function finalizeOrder() {
    if (currentOrder.items.length === 0) {
        NotificationSystem.show("Adicione itens ao pedido antes de finalizar!", "warning");
        return;
    }

    if (inventory && inventory.length > 0) {
        for (const item of currentOrder.items) {
            const inventoryItem = inventory.find((i) => i.productId === item.productId);
            if (inventoryItem && item.quantity > inventoryItem.currentStock) {
                NotificationSystem.show(`Estoque insuficiente para ${item.name}! Disponível: ${inventoryItem.currentStock}`, "error");
                return;
            }
        }
    }

    if (!currentOrder.type) {
        NotificationSystem.show("Selecione o tipo de pedido primeiro!", "warning");
        showOrderModal();
        return;
    }

    if (currentOrder.type === "table" && !currentUser.permissions.includes("mesas")) {
        NotificationSystem.show("Você não tem permissão para ocupar mesas!", "error");
        return;
    }

    const subtotal = currentOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const serviceTax = subtotal * 0.1;
    const total = subtotal + serviceTax;

    const newOrder = {
        id: generateOrderId(),
        type: currentOrder.type,
        tableNumber: currentOrder.tableNumber,
        customerName: currentOrder.customerName,
        items: [...currentOrder.items],
        status: "pending",
        createdAt: new Date(),
        subtotal: subtotal,
        serviceTax: serviceTax,
        total: total,
        waiter: currentUser.profile === "garcom" ? currentUser.name : null,
        cashier: currentUser.profile === "caixa" ? currentUser.name : null,
        paymentStatus: "pending",
    };

    const validationErrors = DataValidator.validateOrder(newOrder);
    if (validationErrors.length > 0) {
        NotificationSystem.show(validationErrors[0], "error");
        return;
    }

    orders.push(newOrder);

    if (inventory && inventory.length > 0) {
        currentOrder.items.forEach((item) => {
            const inventoryItem = inventory.find((i) => i.productId === item.productId);
            if (inventoryItem) {
                inventoryItem.currentStock -= item.quantity;
                inventoryItem.alert = inventoryItem.currentStock <= inventoryItem.minStock;
            }
        });
    }

    if (currentOrder.type === "table" && currentOrder.tableNumber) {
        const mesa = mesas.find((m) => m.numero === currentOrder.tableNumber);
        if (mesa) {
            mesa.status = "ocupada";
            mesa.pedidoId = newOrder.id;
        }
    }

    currentOrder.items = [];
    updateOrderSummary();

    DataManager.saveAppData();

    updateOrdersView();
    updateCozinhaView();
    updateDashboard();
    updateMesasView();

    let mensagem = `Pedido #${newOrder.id} criado com sucesso!`;
    if (newOrder.type === "table") {
        mensagem += ` Mesa ${newOrder.tableNumber} ocupada.`;
    }

    NotificationSystem.show(mensagem, "success");
}