// script/init.js

// Este arquivo configura e inicializa todas as dependências do sistema
// É o ponto de entrada antes do main.js

import { 
    currentUser, 
    products, 
    orders, 
    mesas, 
    inventory, 
    comandas 
} from './utils/constants.js';
import { LocalStorageHelper } from './utils/LocalStorageHelper.js';
import { NotificationSystem } from './modules/notifications.js';
import { DataManager } from './modules/dataManager.js';

class SystemInitializer {
    constructor() {
        this.initialized = false;
        this.startTime = null;
    }

    async initialize() {
        if (this.initialized) {
            console.warn("⚠️ Sistema já inicializado");
            return;
        }

        this.startTime = performance.now();
        console.log("🔧 Inicializando sistema PDV...");

        try {
            // 1. Verificar compatibilidade do navegador
            if (!this.checkBrowserCompatibility()) {
                this.showCompatibilityWarning();
                return;
            }

            // 2. Inicializar localStorage
            if (!LocalStorageHelper.isAvailable()) {
                NotificationSystem.show(
                    "O localStorage não está disponível. Algumas funcionalidades podem não funcionar corretamente.",
                    "warning",
                    10000
                );
            }

            // 3. Carregar dados iniciais
            await this.loadInitialData();

            // 4. Configurar listeners globais
            this.setupGlobalListeners();

            // 5. Configurar eventos de rede
            this.setupNetworkEvents();

            // 6. Inicializar timers do sistema
            this.setupSystemTimers();

            this.initialized = true;
            
            const loadTime = (performance.now() - this.startTime).toFixed(2);
            console.log(`✅ Sistema inicializado em ${loadTime}ms`);
            
            // Disparar evento de inicialização completa
            window.dispatchEvent(new CustomEvent('systemInitialized', {
                detail: { loadTime }
            }));

        } catch (error) {
            console.error("❌ Erro na inicialização do sistema:", error);
            this.handleInitializationError(error);
        }
    }

    checkBrowserCompatibility() {
        const requiredFeatures = [
            'Promise',
            'fetch',
            'localStorage',
            'sessionStorage',
            'CustomEvent',
            'Set',
            'Map'
        ];

        const missingFeatures = requiredFeatures.filter(feature => !window[feature]);
        
        if (missingFeatures.length > 0) {
            console.error("Funcionalidades não suportadas:", missingFeatures);
            return false;
        }

        // Verificar ES6 modules
        try {
            new Function('import("")');
        } catch (e) {
            console.error("Módulos ES6 não suportados");
            return false;
        }

        return true;
    }

    showCompatibilityWarning() {
        const warning = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: white;
                z-index: 9999;
                padding: 40px;
                text-align: center;
                font-family: Arial, sans-serif;
            ">
                <h1 style="color: #e74c3c;">⚠️ Navegador Incompatível</h1>
                <p style="font-size: 18px; margin: 20px 0;">
                    Seu navegador não suporta todas as funcionalidades necessárias.
                </p>
                <p style="margin-bottom: 30px;">
                    Por favor, atualize para uma versão recente do:
                </p>
                <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                    <a href="https://www.google.com/chrome/" target="_blank" style="
                        padding: 12px 24px;
                        background: #4285f4;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: bold;
                    ">Google Chrome</a>
                    <a href="https://www.mozilla.org/firefox/" target="_blank" style="
                        padding: 12px 24px;
                        background: #ff7139;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: bold;
                    ">Mozilla Firefox</a>
                    <a href="https://www.microsoft.com/edge" target="_blank" style="
                        padding: 12px 24px;
                        background: #0078d7;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: bold;
                    ">Microsoft Edge</a>
                </div>
                <p style="margin-top: 40px; color: #666; font-size: 14px;">
                    Este sistema requer um navegador moderno com suporte a JavaScript ES6+.
                </p>
            </div>
        `;
        
        document.body.innerHTML = warning;
    }

    async loadInitialData() {
        console.log("📦 Carregando dados iniciais...");
        
        // Carregar dados do localStorage
        const loaded = DataManager.loadAppData();
        
        if (!loaded) {
            console.log("Usando dados padrão do sistema");
            
            // Inicializar dados de exemplo se não houver dados salvos
            await this.initializeSampleData();
        }

        // Carregar configurações do sistema
        await this.loadSystemConfig();
        
        // Verificar integridade dos dados
        this.validateDataIntegrity();
    }

    async initializeSampleData() {
        // Garantir que temos dados básicos de exemplo
        if (products.length === 0) {
            console.log("Criando produtos de exemplo...");
            
            // Produtos já estão definidos em constants.js
            // Garantir que estejam corretamente inicializados
        }

        if (mesas.length === 0) {
            console.log("Criando mesas de exemplo...");
            
            for (let i = 1; i <= 15; i++) {
                mesas.push({
                    numero: i,
                    status: "livre",
                    pedidoId: null
                });
            }
            
            // Marcar algumas mesas como exemplo
            if (mesas.length >= 3) {
                mesas[2].status = "limpando"; // Mesa 3 em limpeza
            }
        }

        // Salvar dados iniciais
        DataManager.saveAppData();
    }

    async loadSystemConfig() {
        // Carregar configurações do sistema do localStorage
        const config = LocalStorageHelper.getItem("systemConfig") || {};
        
        // Configurações padrão
        const defaultConfig = {
            theme: "light",
            language: "pt-BR",
            currency: "BRL",
            serviceTax: 0.1,
            autoSave: true,
            autoSaveInterval: 30000,
            printReceipt: true,
            soundEnabled: true
        };

        // Mesclar configurações
        window.systemConfig = { ...defaultConfig, ...config };
        
        // Aplicar configurações
        this.applySystemConfig(window.systemConfig);
    }

    applySystemConfig(config) {
        // Aplicar tema
        document.documentElement.setAttribute("data-theme", config.theme);
        
        // Aplicar idioma
        document.documentElement.lang = config.language;
        
        // Configurar moeda
        window.currency = config.currency;
        
        console.log("⚙️ Configurações do sistema aplicadas:", config);
    }

    validateDataIntegrity() {
        console.log("🔍 Validando integridade dos dados...");
        
        let issues = [];
        
        // Verificar pedidos
        orders.forEach((order, index) => {
            if (!order.id || !order.items || !Array.isArray(order.items)) {
                issues.push(`Pedido inválido no índice ${index}`);
            }
        });
        
        // Verificar mesas
        mesas.forEach((mesa, index) => {
            if (!mesa.numero || !mesa.status) {
                issues.push(`Mesa inválida no índice ${index}`);
            }
        });
        
        // Verificar produtos
        products.forEach((product, index) => {
            if (!product.name || product.price === undefined) {
                issues.push(`Produto inválido no índice ${index}`);
            }
        });
        
        if (issues.length > 0) {
            console.warn("⚠️ Problemas encontrados na integridade dos dados:", issues);
            
            // Tentar corrigir problemas automaticamente
            this.fixDataIssues(issues);
        } else {
            console.log("✓ Dados validados com sucesso");
        }
    }

    fixDataIssues(issues) {
        console.log("🔧 Tentando corrigir problemas de dados...");
        
        // Corrigir pedidos sem ID
        orders.forEach((order, index) => {
            if (!order.id) {
                order.id = Date.now() + index;
                console.log(`Atribuído ID ${order.id} ao pedido ${index}`);
            }
        });
        
        // Corrigir mesas sem status
        mesas.forEach((mesa, index) => {
            if (!mesa.status) {
                mesa.status = "livre";
                console.log(`Atribuído status "livre" à mesa ${index}`);
            }
        });
        
        // Salvar correções
        DataManager.saveAppData();
    }

    setupGlobalListeners() {
        console.log("🎧 Configurando listeners globais...");
        
        // Listener para erros não tratados
        window.addEventListener('error', (event) => {
            console.error('❌ Erro não tratado:', event.error);
            
            // Enviar para sistema de notificações se for um erro crítico
            if (event.error.message.includes('critical') || event.error.message.includes('fatal')) {
                NotificationSystem.show(
                    `Erro crítico: ${event.error.message}. Por favor, recarregue a página.`,
                    'error',
                    10000
                );
            }
        });

        // Listener para promessas não tratadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Promessa rejeitada não tratada:', event.reason);
        });

        // Listener para mudança de conexão
        window.addEventListener('online', () => {
            NotificationSystem.show("Conexão restaurada", "success");
            window.dispatchEvent(new CustomEvent('connectionRestored'));
        });

        window.addEventListener('offline', () => {
            NotificationSystem.show("Você está offline. Algumas funcionalidades podem estar limitadas.", "warning", 10000);
            window.dispatchEvent(new CustomEvent('connectionLost'));
        });

        // Listener para impressão
        window.addEventListener('beforeprint', () => {
            window.dispatchEvent(new CustomEvent('beforePrint'));
        });

        window.addEventListener('afterprint', () => {
            window.dispatchEvent(new CustomEvent('afterPrint'));
        });
    }

    setupNetworkEvents() {
        // Monitorar qualidade da conexão
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => {
                const connection = navigator.connection;
                console.log('📶 Mudança na conexão:', {
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt
                });
                
                if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                    NotificationSystem.show("Conexão lenta detectada", "warning");
                }
            });
        }
    }

    setupSystemTimers() {
        // Timer para verificação periódica do sistema
        setInterval(() => {
            this.performSystemCheck();
        }, 60000); // A cada minuto

        // Timer para limpeza de dados temporários
        setInterval(() => {
            this.cleanupTemporaryData();
        }, 300000); // A cada 5 minutos
    }

    performSystemCheck() {
        const checks = {
            memory: this.checkMemoryUsage(),
            data: this.checkDataHealth(),
            connection: navigator.onLine ? 'online' : 'offline',
            time: new Date().toISOString()
        };

        console.log("🔍 Verificação do sistema:", checks);
        
        // Se o uso de memória estiver alto, avisar
        if (checks.memory > 80) {
            console.warn("⚠️ Uso alto de memória detectado");
        }
    }

    checkMemoryUsage() {
        if (performance.memory) {
            const used = performance.memory.usedJSHeapSize;
            const total = performance.memory.totalJSHeapSize;
            return Math.round((used / total) * 100);
        }
        return 0;
    }

    checkDataHealth() {
        let health = 100;
        
        // Verificar tamanho dos dados
        const ordersSize = orders.length;
        const productsSize = products.length;
        
        if (ordersSize > 1000) health -= 20;
        if (productsSize > 500) health -= 10;
        
        // Verificar dados corrompidos
        const corruptedOrders = orders.filter(o => !o.id || !o.items).length;
        const corruptedProducts = products.filter(p => !p.name || p.price === undefined).length;
        
        if (corruptedOrders > 0) health -= (corruptedOrders / ordersSize) * 50;
        if (corruptedProducts > 0) health -= (corruptedProducts / productsSize) * 50;
        
        return Math.max(0, Math.round(health));
    }

    cleanupTemporaryData() {
        console.log("🧹 Limpando dados temporários...");
        
        // Limpar notificações antigas
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notif => {
            if (!notif.classList.contains('show')) {
                notif.remove();
            }
        });
        
        // Limpar modais temporários
        const tempModals = document.querySelectorAll('#payment-modal-dynamic, #add-product-modal, #edit-product-modal');
        tempModals.forEach(modal => {
            if (!modal.classList.contains('active')) {
                modal.remove();
            }
        });
    }

    handleInitializationError(error) {
        // Log detalhado do erro
        console.error("Detalhes do erro:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        // Mostrar mensagem amigável ao usuário
        const errorMessage = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: white;
                text-align: center;
                padding: 20px;
            ">
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    padding: 40px;
                    border-radius: 20px;
                    max-width: 600px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                ">
                    <h1 style="margin-bottom: 20px; font-size: 2.5rem;">😕 Ops!</h1>
                    <p style="font-size: 1.2rem; margin-bottom: 30px; line-height: 1.6;">
                        Ocorreu um erro ao inicializar o sistema. 
                        Por favor, recarregue a página ou entre em contato com o suporte.
                    </p>
                    
                    <div style="
                        background: rgba(0, 0, 0, 0.2);
                        padding: 20px;
                        border-radius: 10px;
                        margin-bottom: 30px;
                        text-align: left;
                        font-family: monospace;
                        font-size: 0.9rem;
                        max-height: 150px;
                        overflow-y: auto;
                    ">
                        <strong>Detalhes técnicos:</strong><br>
                        ${error.name}: ${error.message}
                    </div>
                    
                    <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                        <button onclick="window.location.reload()" style="
                            padding: 12px 30px;
                            background: white;
                            color: #667eea;
                            border: none;
                            border-radius: 50px;
                            font-weight: bold;
                            cursor: pointer;
                            font-size: 1rem;
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='scale(1.05)'" 
                         onmouseout="this.style.transform='scale(1)'">
                            🔄 Recarregar Página
                        </button>
                        
                        <button onclick="localStorage.clear(); window.location.reload()" style="
                            padding: 12px 30px;
                            background: rgba(255, 255, 255, 0.2);
                            color: white;
                            border: 2px solid white;
                            border-radius: 50px;
                            font-weight: bold;
                            cursor: pointer;
                            font-size: 1rem;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" 
                         onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                            🧹 Limpar Dados & Recarregar
                        </button>
                    </div>
                    
                    <p style="margin-top: 30px; font-size: 0.9rem; opacity: 0.8;">
                        Se o problema persistir, entre em contato com o suporte técnico.
                    </p>
                </div>
            </div>
        `;
        
        document.body.innerHTML = errorMessage;
    }

    // Métodos de utilidade pública
    getSystemInfo() {
        return {
            version: '1.0.0',
            initialized: this.initialized,
            loadTime: this.startTime ? (performance.now() - this.startTime).toFixed(2) : null,
            dataStats: {
                products: products.length,
                orders: orders.length,
                mesas: mesas.length,
                inventory: inventory.length
            },
            config: window.systemConfig || {},
            user: currentUser ? {
                name: currentUser.name,
                profile: currentUser.profile,
                permissions: currentUser.permissions
            } : null
        };
    }

    resetSystem() {
        return new Promise((resolve, reject) => {
            try {
                NotificationSystem.confirm(
                    "Deseja realmente resetar o sistema? Todos os dados serão perdidos.",
                    "Resetar",
                    "Cancelar"
                ).then(async (confirmed) => {
                    if (confirmed) {
                        console.log("🔄 Resetando sistema...");
                        
                        // Limpar todos os dados
                        LocalStorageHelper.clear();
                        
                        // Limpar arrays
                        products.length = 0;
                        orders.length = 0;
                        mesas.length = 0;
                        inventory.length = 0;
                        comandas.length = 0;
                        
                        // Limpar usuário atual
                        currentUser = null;
                        
                        // Recarregar a página
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                        
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    exportDebugInfo() {
        const debugInfo = {
            system: this.getSystemInfo(),
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight
            },
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio
            },
            localStorage: {
                available: LocalStorageHelper.isAvailable(),
                keys: Object.keys(localStorage)
            },
            performance: {
                memory: performance.memory ? {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                  totalJSHeapSize: performance.memory.totalJSHeapSize,
                  jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                } : null,
                timing: performance.timing ? {
                    loadEventEnd: performance.timing.loadEventEnd,
                    domComplete: performance.timing.domComplete,
                    domInteractive: performance.timing.domInteractive
                } : null
            }
        };

        // Exportar como arquivo JSON
        const dataStr = JSON.stringify(debugInfo, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug_info_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return debugInfo;
    }
}

// Criar instância global do inicializador
const systemInitializer = new SystemInitializer();

// Exportar para uso em main.js
export default systemInitializer;

// Inicializar automaticamente quando carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        systemInitializer.initialize();
    });
} else {
    systemInitializer.initialize();
}