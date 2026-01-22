// ===========================
// INIT.JS - Inicialização do Sistema (ATUALIZADO)
// ===========================

import { INITIAL_PRODUCTS } from './utils/constants.js';
import { dataManager } from './modules/dataManager.js';
import { authManager } from './modules/auth.js';
import { navigationManager } from './modules/navigation.js';
import { pdvManager } from './modules/pdv.js';
import { ordersManager } from './modules/orders.js';
import { kitchenManager } from './modules/kitchen.js';
import { tablesManager } from './modules/tables.js';
import { dashboardManager } from './modules/dashboard.js';
import { reportsManager } from './modules/reports.js';
import { productsManager } from './modules/products.js';
import { modalsManager } from './modules/modals.js';
import { employeesManager } from './modules/employees.js';
import { caixaManager } from './modules/caixa.js';
import { NotificationSystem } from './modules/notifications.js';
import { deliveryManager } from './modules/delivery.js';

/**
 * Inicializa o sistema completo
 */
export function initializeSystem() {
    console.log("🚀 Sistema iniciando...");

    // 1. Carrega dados salvos
    const dataLoaded = dataManager.loadAppData();
    
    // Se não houver produtos, carrega produtos iniciais
    if (dataManager.products.length === 0) {
        dataManager.products = [...INITIAL_PRODUCTS];
        dataManager.saveAppData();
    }

    // Inicializa array de funcionários se não existir
    if (!dataManager.employees) {
        dataManager.employees = [];
        dataManager.saveAppData();
    }

    // 2. Inicializa autenticação
    authManager.initializeLogin();
    
    // 3. Tenta restaurar sessão
    const sessionRestored = authManager.restoreSession();

    // 4. Se restaurou sessão, inicializa sistema
    if (sessionRestored) {
        initializeModules();
    }

    // 5. Escuta evento de login
    document.addEventListener('userLoggedIn', () => {
        initializeModules();
    });

    // 6. Escuta evento de logout
    document.addEventListener('userLoggedOut', () => {
        // Limpa timers e listeners se necessário
    });

    // 7. Salva dados antes de sair
    window.addEventListener("beforeunload", () => {
        if (authManager.isAuthenticated()) {
            dataManager.saveAppData();
        }
    });

    // 8. Escuta eventos de atualização
    setupGlobalEventListeners();

    console.log("✅ Sistema inicializado");
}

/**
 * Inicializa todos os módulos
 */
function initializeModules() {
    // Inicializa navegação
    navigationManager.initialize();

    // Inicializa modais
    modalsManager.initialize();

    // Registra callbacks de mudança de aba
    navigationManager.onTabChange((tabId) => {
        switch (tabId) {
            case 'dashboard':
                dashboardManager.initialize();
                dashboardManager.updateView();
                break;
            case 'pdv':
                pdvManager.initialize();
                pdvManager.loadProducts();
                pdvManager.updateOrderSummary();
                break;
            case 'pedidos':
                ordersManager.initialize();
                ordersManager.updateView();
                break;
            case 'cozinha':
                kitchenManager.initialize();
                kitchenManager.updateView();
                break;
            case 'mesas':
                tablesManager.initialize();
                tablesManager.updateView();
                break;
            case 'relatorios':
                reportsManager.initialize();
                break;
            case 'produtos':
                productsManager.initialize();
                productsManager.updateView();
                break;
            case 'funcionarios':
                employeesManager.initialize();
                employeesManager.updateView();
                break;
            case 'caixa':
                caixaManager.initialize();
                break;
            case 'delivery':
                deliveryManager.initialize();
                deliveryManager.updateView();
                break;
 
        }
    });

    // Inicializa aba padrão
    if (authManager.hasPermission('dashboard')) {
        navigationManager.goToTab('dashboard');
    } else if (authManager.hasPermission('pdv')) {
        navigationManager.goToTab('pdv');
    } else {
        // Vai para primeira aba com permissão
        const firstTab = authManager.getCurrentUser()?.permissions[0];
        if (firstTab) {
            navigationManager.goToTab(firstTab);
        }
    }
}
/**
 * Configura event listeners globais
 */
function setupGlobalEventListeners() {
    // Evento de pedido criado
    document.addEventListener('orderCreated', () => {
        ordersManager.updateView();
        kitchenManager.updateView();
        dashboardManager.updateView();
        tablesManager.updateView();
    });

    // Evento de pedidos atualizados
    document.addEventListener('ordersUpdated', () => {
        ordersManager.updateView();
        kitchenManager.updateView();
        dashboardManager.updateView();
        tablesManager.updateView();
    });

    // Evento de produto adicionado/atualizado
    document.addEventListener('productAdded', () => {
        pdvManager.loadProducts();
    });

    document.addEventListener('productUpdated', () => {
        pdvManager.loadProducts();
    });

    // Evento de dados importados
    document.addEventListener('dataImported', () => {
        ordersManager.updateView();
        kitchenManager.updateView();
        dashboardManager.updateView();
        tablesManager.updateView();
        productsManager.updateView();
        employeesManager.updateView();
        pdvManager.loadProducts();
    });

    // Evento de escape global
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                activeModal.classList.remove("active");
            }
        }
    });
    
    // Evento de caixa atualizado
    document.addEventListener('caixaUpdated', () => {
        console.log('Global: Caixa foi atualizado');
        
        // Se estivermos na aba caixa, atualiza a view
        if (navigationManager.getCurrentTab() === 'caixa') {
            caixaManager.updateView();
        }
        
        // Também atualiza o dashboard se estiver visível
        if (navigationManager.getCurrentTab() === 'dashboard') {
            dashboardManager.updateView();
        }
    });
    
    // Evento para redirecionar ao PDV com mesa específica
    document.addEventListener('redirectToPDVWithMesa', (event) => {
        const { mesaNumero, pedidoId } = event.detail || {};
        
        if (!mesaNumero) {
            console.error('Número da mesa não especificado');
            return;
        }
        
        console.log(`Redirecionando para PDV com mesa ${mesaNumero}`);
        
        // 1. Vai para a aba PDV
        navigationManager.goToTab('pdv');
        
        // 2. Aguarda a aba carregar
        setTimeout(() => {
            const mesa = dataManager.mesas.find(m => m.numero === mesaNumero);
            if (!mesa) {
                NotificationSystem.error(`Mesa ${mesaNumero} não encontrada!`);
                return;
            }
            
            // 3. Configura pdvManager com os dados da mesa
            if (pdvManager) {
                // Define os dados básicos da mesa
                pdvManager.setOrderData({
                    type: "table",
                    tableNumber: mesaNumero,
                    customerName: ""
                });
                
                // 4. Carrega o pedido existente se houver (MODO EDIÇÃO)
                let pedidoParaCarregar = null;
                
                if (pedidoId) {
                    pedidoParaCarregar = dataManager.orders.find(o => o.id === pedidoId);
                } else if (mesa.pedidoId && mesa.status === "ocupada") {
                    pedidoParaCarregar = dataManager.orders.find(o => o.id === mesa.pedidoId);
                }
                
                if (pedidoParaCarregar) {
                    // ✅ USA O NOVO MÉTODO DE EDIÇÃO
                    const loaded = pdvManager.loadExistingOrderForEdit(pedidoParaCarregar.id);
                    
                    if (loaded) {
                        console.log(`Pedido #${pedidoParaCarregar.id} carregado para edição`);
                    } else {
                        console.error('Falha ao carregar pedido para edição');
                        NotificationSystem.error('Erro ao carregar pedido');
                    }
                } else {
                    console.log(`Novo pedido para Mesa ${mesaNumero}`);
                    NotificationSystem.success(`Mesa ${mesaNumero} configurada para novo pedido`);
                }
                
                // 5. Sincroniza campos visuais
                syncPDVInputs(mesaNumero, pedidoParaCarregar);
            }
        }, 400);
    });
    
    /**
     * Sincroniza os inputs do PDV com os dados da mesa
     */
    function syncPDVInputs(mesaNumero, pedido) {
        const typeSelector = document.getElementById("pdv-type-selector");
        const tableInput = document.getElementById("pdv-table-input");
        const customerInput = document.getElementById("pdv-customer-input");
        
        if (typeSelector) {
            typeSelector.value = "table";
            // Dispara o evento change para mostrar/esconder campos
            typeSelector.dispatchEvent(new Event('change'));
        }
        
        if (tableInput) {
            tableInput.value = mesaNumero;
            // Sincroniza com o objeto currentOrder
            if (pdvManager) {
                pdvManager.currentOrder.tableNumber = mesaNumero;
            }
        }
        
        if (customerInput) {
            customerInput.value = pedido && pedido.customerName ? pedido.customerName : "";
            if (pdvManager) {
                pdvManager.currentOrder.customerName = customerInput.value;
            }
        }
    }
}