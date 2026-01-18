// script/modules/navigation.js

import { currentUser } from '../utils/constants.js';
import { NotificationSystem } from './notifications.js';
import { loadPDVProducts, updateOrderSummary } from './pdv.js';
import { updateOrdersView } from './orders.js';
import { updateMesasView } from './tables.js';
import { updateCozinhaView } from './kitchen.js';
import { updateDashboard } from './dashboard.js';
import { updateRelatoriosView } from './reports.js';
import { updateProdutosView } from './products.js';

export function initializeNavigation() {
    const navItems = document.querySelectorAll(".nav-item:not(.dropdown)");

    navItems.forEach((item) => {
        item.addEventListener("click", function () {
            if (this.style.display === "none") return;

            const tabId = this.getAttribute("data-tab");

            if (!currentUser.permissions.includes(tabId)) {
                NotificationSystem.show("Você não tem permissão!", "error");
                return;
            }

            navItems.forEach((nav) => nav.classList.remove("active"));
            this.classList.add("active");

            document.querySelectorAll(".dropdown-item").forEach((item) => {
                item.classList.remove("active");
            });

            const dropdown = document.getElementById("atendimento-dropdown");
            if (dropdown) dropdown.classList.remove("active");

            switchToTab(tabId);
        });
    });
}


export function initializeDropdownMenu() {
    if (window.dropdownInitialized) return;
    window.dropdownInitialized = true;

    const dropdown = document.getElementById("atendimento-dropdown");
    if (!dropdown) return;

    const dropdownHeader = dropdown.querySelector(".nav-item-header");
    if (dropdownHeader) {
        dropdownHeader.addEventListener("click", function (e) {
            e.stopPropagation();
            dropdown.classList.toggle("active");
        });
    }

    const dropdownItems = dropdown.querySelectorAll(".dropdown-item");
    dropdownItems.forEach((item) => {
        item.addEventListener("click", function (e) {
            e.stopPropagation();

            if (!currentUser) {
                NotificationSystem.show("Faça login primeiro!", "error");
                return;
            }

            const tabId = this.getAttribute("data-tab");

            if (!currentUser.permissions.includes(tabId)) {
                NotificationSystem.show("Você não tem permissão!", "error");
                return;
            }

            dropdownItems.forEach((i) => i.classList.remove("active"));
            this.classList.add("active");
            dropdown.classList.remove("active");

            switchToTab(tabId);
        });
    });

    document.addEventListener("click", function (e) {
        if (dropdown && !dropdown.contains(e.target) && dropdown.classList.contains("active")) {
            dropdown.classList.remove("active");
        }
    });
}

export function switchToTab(tabId) {
    const tabContents = document.querySelectorAll(".tab-content");
    const pageTitle = document.getElementById("page-title");

    tabContents.forEach((tab) => tab.classList.remove("active"));

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add("active");

        if (pageTitle) {
            pageTitle.textContent = getTabDisplayName(tabId);
        }

        switch (tabId) {
            case "pdv":
                loadPDVProducts();
                updateOrderSummary();
                break;
            case "pedidos":
                updateOrdersView();
                break;
            case "mesas":
                updateMesasView();
                break;
            case "cozinha":
                updateCozinhaView();
                break;
            case "dashboard":
                updateDashboard();
                break;
            case "relatorios":
                updateRelatoriosView();
                break;
            case "produtos":
                updateProdutosView();
                break;
        }
    }
}

export function applyPermissions() {
    const navItems = document.querySelectorAll(".nav-item:not(.dropdown)");
    const dropdownItems = document.querySelectorAll(".dropdown-item");

    navItems.forEach((item) => {
        const tab = item.getAttribute("data-tab");
        if (tab && (!currentUser || !currentUser.permissions.includes(tab))) {
            item.style.display = "none";
        } else if (tab) {
            item.style.display = "flex";
        }
    });

    dropdownItems.forEach((item) => {
        const tab = item.getAttribute("data-tab");
        if (tab && (!currentUser || !currentUser.permissions.includes(tab))) {
            item.style.display = "none";
        } else if (tab) {
            item.style.display = "flex";
        }
    });

    const atendimentoDropdown = document.getElementById("atendimento-dropdown");
    if (atendimentoDropdown) {
        const visibleChild = Array.from(atendimentoDropdown.querySelectorAll(".dropdown-item"))
            .some(item => item.style.display !== "none");
        atendimentoDropdown.style.display = visibleChild ? "block" : "none";
    }
}

export function initializeSystemWithPermissions() {
    if (!products || products.length === 0) {
        DataManager.loadAppData();
    }

    initializeNavigation();
    initializeDropdownMenu();
    initializeDashboard();
    initializePDV();
    initializeOrders();
    initializeCozinha();
    initializeMesas();
    initializeRelatorios();
    initializeProdutos();

    applyPermissions();

    setTimeout(() => {
        if (currentUser && currentUser.permissions.includes("pdv")) {
            loadPDVProducts();
        }
        updateOrderSummary();
        updateDashboard();
        updateMesasView();
    }, 100);
}