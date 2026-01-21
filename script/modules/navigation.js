// ===========================
// NAVIGATION - Navegação e Tabs (ATUALIZADO)
// ===========================

import { getTabDisplayName } from '../utils/helpers.js';
import { NotificationSystem } from './notifications.js';
import { authManager } from './auth.js';

export class NavigationManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.dropdownsInitialized = false;
        this.onTabChangeCallbacks = [];
    }

    /**
     * Inicializa TODOS os dropdowns (Atendimento e Cadastro)
     */
    initializeDropdowns() {
        if (this.dropdownsInitialized) return;
        this.dropdownsInitialized = true;

        // Dropdown Atendimento
        this.setupDropdown("atendimento-dropdown");
        
        // Dropdown Cadastro (NOVO)
        this.setupDropdown("cadastro-dropdown");
    }

    /**
     * Configura um dropdown genérico
     */
    setupDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const dropdownHeader = dropdown.querySelector(".nav-item-header");
        if (dropdownHeader) {
            dropdownHeader.addEventListener("click", (e) => {
                e.stopPropagation();
                
                // Fecha outros dropdowns
                document.querySelectorAll('.nav-item-dropdown, .nav-item.dropdown').forEach(d => {
                    if (d.id !== dropdownId) {
                        d.classList.remove("active");
                    }
                });
                
                dropdown.classList.toggle("active");
            });
        }

        const dropdownItems = dropdown.querySelectorAll(".dropdown-item");
        dropdownItems.forEach((item) => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();

                if (!authManager.isAuthenticated()) {
                    NotificationSystem.error("Faça login primeiro!");
                    return;
                }

                const tabId = item.getAttribute("data-tab");

                if (!authManager.hasPermission(tabId)) {
                    NotificationSystem.error("Você não tem permissão!");
                    return;
                }

                // Remove active de todos os itens do dropdown
                dropdownItems.forEach((i) => i.classList.remove("active"));
                item.classList.add("active");
                
                // Fecha o dropdown
                dropdown.classList.remove("active");

                this.switchToTab(tabId);
            });
        });

        // Fecha dropdown ao clicar fora
        document.addEventListener("click", (e) => {
            if (dropdown && !dropdown.contains(e.target) && dropdown.classList.contains("active")) {
                dropdown.classList.remove("active");
            }
        });
    }

    /**
     * Inicializa navegação principal
     */
    initializeNavigation() {
        const navItems = document.querySelectorAll(".nav-item:not(.dropdown)");

        navItems.forEach((item) => {
            item.addEventListener("click", () => {
                if (item.style.display === "none") return;

                const tabId = item.getAttribute("data-tab");

                if (!authManager.hasPermission(tabId)) {
                    NotificationSystem.error("Você não tem permissão!");
                    return;
                }

                navItems.forEach((nav) => nav.classList.remove("active"));
                item.classList.add("active");

                // Remove active dos itens dos dropdowns
                document.querySelectorAll(".dropdown-item").forEach((dropItem) => {
                    dropItem.classList.remove("active");
                });

                // Fecha todos os dropdowns
                document.querySelectorAll('.nav-item-dropdown, .nav-item.dropdown').forEach(d => {
                    d.classList.remove("active");
                });

                this.switchToTab(tabId);
            });
        });
    }

    /**
     * Troca de aba
     */
    switchToTab(tabId) {
        const tabContents = document.querySelectorAll(".tab-content");
        const pageTitle = document.getElementById("page-title");

        tabContents.forEach((tab) => tab.classList.remove("active"));

        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add("active");

            if (pageTitle) {
                pageTitle.textContent = getTabDisplayName(tabId);
            }

            this.currentTab = tabId;

            this.onTabChangeCallbacks.forEach(callback => {
                try {
                    callback(tabId);
                } catch (error) {
                    console.error("Erro no callback de mudança de aba:", error);
                }
            });

            document.dispatchEvent(new CustomEvent('tabChanged', {
                detail: { tabId }
            }));
        }
    }

    /**
     * Registra callback para mudança de aba
     */
    onTabChange(callback) {
        if (typeof callback === 'function') {
            this.onTabChangeCallbacks.push(callback);
        }
    }

    /**
     * Aplica permissões de navegação
     */
    applyPermissions() {
        const navItems = document.querySelectorAll(".nav-item:not(.dropdown)");
        const dropdownItems = document.querySelectorAll(".dropdown-item");

        navItems.forEach((item) => {
            const tab = item.getAttribute("data-tab");
            if (tab && !authManager.hasPermission(tab)) {
                item.style.display = "none";
            } else if (tab) {
                item.style.display = "flex";
            }
        });

        dropdownItems.forEach((item) => {
            const tab = item.getAttribute("data-tab");
            if (tab && !authManager.hasPermission(tab)) {
                item.style.display = "none";
            } else if (tab) {
                item.style.display = "flex";
            }
        });

        // Esconde dropdown Atendimento se não houver itens visíveis
        const atendimentoDropdown = document.getElementById("atendimento-dropdown");
        if (atendimentoDropdown) {
            const hasVisibleItems = Array.from(atendimentoDropdown.querySelectorAll(".dropdown-item"))
                .some(item => item.style.display !== "none");
            atendimentoDropdown.style.display = hasVisibleItems ? "block" : "none";
        }

        // Esconde dropdown Cadastro se não houver itens visíveis
        const cadastroDropdown = document.getElementById("cadastro-dropdown");
        if (cadastroDropdown) {
            const hasVisibleItems = Array.from(cadastroDropdown.querySelectorAll(".dropdown-item"))
                .some(item => item.style.display !== "none");
            cadastroDropdown.style.display = hasVisibleItems ? "block" : "none";
        }
    }

    /**
     * Vai para aba específica (se tiver permissão)
     */
    goToTab(tabId) {
        if (!authManager.hasPermission(tabId)) {
            NotificationSystem.error("Você não tem permissão para acessar esta área!");
            return false;
        }

        this.switchToTab(tabId);
        return true;
    }

    /**
     * Obtém aba atual
     */
    getCurrentTab() {
        return this.currentTab;
    }

    /**
     * Inicializa tudo
     */
    initialize() {
        this.initializeNavigation();
        this.initializeDropdowns();
        this.applyPermissions();
    }
}

export const navigationManager = new NavigationManager();
