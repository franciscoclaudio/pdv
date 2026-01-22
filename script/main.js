// ===========================
// MAIN.JS - Ponto de Entrada Principal
// Sistema PDV - Restaurantes & Bares
// ===========================

import { initializeSystem } from './init.js';
import { initLogoUpload } from './logo.js';
import { deliveryManager } from './modules/delivery.js';
import { reportsManager } from './modules/reports.js';

/**
 * Ponto de entrada da aplicação
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Inicializa o sistema principal
        initializeSystem();

        // Inicializa o upload/preview da logomarca (chamado aqui para evitar duplicações)
        initLogoUpload();
    } catch (error) {
        console.error("❌ Erro crítico na inicialização:", error);
        
        // Mostra mensagem de erro para o usuário
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            z-index: 10000;
            text-align: center;
            max-width: 500px;
        `;
        
        errorDiv.innerHTML = `
            <h2 style="color: #e74c3c; margin-bottom: 15px;">
                ⚠️ Erro ao Iniciar o Sistema
            </h2>
            <p style="margin-bottom: 20px;">
                Ocorreu um erro crítico ao inicializar o sistema. 
                Por favor, recarregue a página.
            </p>
            <button 
                onclick="location.reload()" 
                style="
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                "
            >
                Recarregar Página
            </button>
            <details style="margin-top: 20px; text-align: left;">
                <summary style="cursor: pointer; color: #666;">
                    Detalhes técnicos
                </summary>
                <pre style="
                    margin-top: 10px;
                    padding: 10px;
                    background: #f5f5f5;
                    border-radius: 4px;
                    font-size: 12px;
                    overflow: auto;
                ">${error.stack || error.message}</pre>
            </details>
        `;
        
        document.body.appendChild(errorDiv);
    }
});

/**
 * Tratamento de erros não capturados
 */
window.addEventListener('error', (event) => {
    console.error('❌ Erro não capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rejeitada não tratada:', event.reason);
});

/**
 * Log de informações do sistema (desenvolvimento)
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log(`
╔═══════════════════════════════════════╗
║   Sistema PDV - Modo Desenvolvimento  ║
╠═══════════════════════════════════════╣
║  Versão: 1.0.0                        ║
║  Autor: Sistema PDV                   ║
║  Data: ${new Date().toLocaleDateString('pt-BR')}                     ║
╚═══════════════════════════════════════╝
    `);
}