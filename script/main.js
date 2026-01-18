// script/main.js (versão atualizada)

import systemInitializer from './init.js';
import { DataManager } from './modules/dataManager.js';
import { initializeLogin, showMainSystem } from './modules/auth.js';
import { initializeMesaModal } from './modules/modals.js';
import { LocalStorageHelper } from './utils/LocalStorageHelper.js';
import { currentUser } from './utils/constants.js';
import { NotificationSystem } from './modules/notifications.js';

// Aguardar inicialização do sistema
window.addEventListener('systemInitialized', async (event) => {
    console.log(`✅ Sistema pronto (carregado em ${event.detail.loadTime}ms)`);
    
    try {
        // Inicializar componentes específicos
        await initializeComponents();
        
        // Verificar se há usuário logado
        checkUserSession();
        
        // Configurar salvamento automático
        setupAutoSave();
        
        console.log("🎉 Sistema completamente inicializado e pronto para uso");
        
    } catch (error) {
        console.error("❌ Erro na inicialização dos componentes:", error);
        NotificationSystem.show(
            "Erro ao inicializar componentes do sistema. Por favor, recarregue a página.",
            "error"
        );
    }
});

async function initializeComponents() {
    console.log("🔧 Inicializando componentes...");
    
    // Inicializar login
    initializeLogin();
    
    // Inicializar modal de mesa
    initializeMesaModal();
    
    // Configurar preview de logomarca
    setupLogoPreview();
    
    // Carregar dados do sistema
    DataManager.loadAppData();
    
    console.log("✓ Componentes inicializados");
}

function setupLogoPreview() {
    const inputSeletor = document.getElementById("seletorDeImagem");
    const imagemCarregada = document.getElementById("imagemCarregada");
    
    if (inputSeletor && imagemCarregada) {
        inputSeletor.addEventListener("change", function (event) {
            const arquivo = event.target.files[0];
            if (arquivo) {
                const leitor = new FileReader();
                leitor.onload = function (e) {
                    imagemCarregada.src = e.target.result;
                    imagemCarregada.style.display = "block";
                    
                    // Salvar no localStorage
                    LocalStorageHelper.setItem("logoImage", e.target.result);
                };
                leitor.readAsDataURL(arquivo);
            }
        });
        
        // Carregar imagem salva se existir
        const savedLogo = LocalStorageHelper.getItem("logoImage");
        if (savedLogo) {
            imagemCarregada.src = savedLogo;
            imagemCarregada.style.display = "block";
        }
    }
}

function checkUserSession() {
    const savedUser = LocalStorageHelper.getItem("currentUser");
    if (savedUser) {
        try {
            // Atualizar usuário atual
            Object.assign(currentUser, savedUser);
            
            // Mostrar sistema principal
            showMainSystem();
            
            console.log("👤 Sessão restaurada para:", currentUser.name);
        } catch (error) {
            console.error("Erro ao carregar usuário:", error);
            LocalStorageHelper.removeItem("currentUser");
        }
    }
}

function setupAutoSave() {
    // Salvar antes de fechar
    window.addEventListener("beforeunload", function (e) {
        if (currentUser) {
            DataManager.saveAppData();
        }
    });
    
    // Salvar periodicamente
    setInterval(() => {
        if (currentUser) {
            DataManager.saveAppData();
        }
    }, 30000); // A cada 30 segundos
}

// Exportar para debug (apenas desenvolvimento)
if (process.env.NODE_ENV === 'development') {
    window.systemInitializer = systemInitializer;
    window.DataManager = DataManager;
    window.LocalStorageHelper = LocalStorageHelper;
    
    // Adicionar comandos úteis ao console
    console.log(`
    🛠️  Comandos de desenvolvimento disponíveis:
    
    • systemInitializer.getSystemInfo() - Informações do sistema
    • systemInitializer.exportDebugInfo() - Exportar info de debug
    • systemInitializer.resetSystem() - Resetar sistema
    • DataManager.exportData() - Exportar backup
    • DataManager.importData(file) - Importar backup
    
    • currentUser - Usuário atual
    • products - Lista de produtos
    • orders - Lista de pedidos
    • mesas - Lista de mesas
    `);
}