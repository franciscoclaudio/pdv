// ===========================
// TABLES - Controle de Mesas
// ===========================

import { dataManager } from './dataManager.js';
import { NotificationSystem } from './notifications.js';
import { authManager } from './auth.js';
import { formatCurrency, generateOrderId } from '../utils/helpers.js';
import { CONFIG } from '../utils/constants.js';

/**
 * Gerenciador de mesas
 */
export class TablesManager {
    constructor() {
        this.initialized = false;
    }

    /**
     * Inicializa módulo de mesas
     */
    initialize() {
        if (this.initialized) return;
        this.initialized = true;

        // Garante mesas mínimas
        while (dataManager.mesas.length < CONFIG.TOTAL_TABLES) {
            dataManager.mesas.push({
                numero: dataManager.mesas.length + 1,
                status: "livre",
                pedidoId: null
            });
        }

        this.setupFilters();
        this.updateView();
    }

    /**
     * Configura filtros
     */
    setupFilters() {
        const filterSelect = document.getElementById("filter-mesas");
        if (filterSelect) {
            filterSelect.addEventListener("change", (e) => {
                this.filterByStatus(e.target.value);
            });
        }
    }

    /**
     * Atualiza visualização completa
     */
    updateView() {
        this.updateStats();
        this.updateGrid();
    }

    /**
     * Atualiza cards de estatísticas
     */
    updateStats() {
        const totalMesas = dataManager.mesas.length;
        const mesasLivres = dataManager.mesas.filter(m => m.status === "livre").length;
        const mesasOcupadas = dataManager.mesas.filter(m => m.status === "ocupada").length;
        const mesasLimpando = dataManager.mesas.filter(m => m.status === "limpando").length;

        const totalEl = document.getElementById("mesas-total-count");
        const livresEl = document.getElementById("mesas-livres-count");
        const ocupadasEl = document.getElementById("mesas-ocupadas-count");
        const limpandoEl = document.getElementById("mesas-limpando-count");

        if (totalEl) totalEl.textContent = totalMesas;
        if (livresEl) livresEl.textContent = mesasLivres;
        if (ocupadasEl) ocupadasEl.textContent = mesasOcupadas;
        if (limpandoEl) limpandoEl.textContent = mesasLimpando;
    }

    /**
     * Atualiza grid de mesas
     */
    updateGrid() {
        const mesasGrid = document.getElementById("mesas-number-grid");
        if (!mesasGrid) return;

        mesasGrid.innerHTML = "";

        dataManager.mesas.forEach((mesa) => {
            const mesaElement = this.createMesaCard(mesa);
            mesasGrid.appendChild(mesaElement);
        });
    }

    /**
     * Cria card de mesa
     */
    createMesaCard(mesa) {
        const mesaElement = document.createElement("div");
        mesaElement.className = `mesa-number-card ${mesa.status}`;
    
        const pedido = mesa.pedidoId 
            ? dataManager.orders.find(o => o.id === mesa.pedidoId) 
            : null;
    
        const pedidoInfoHtml = mesa.status === "ocupada" && pedido
            ? `<div class="mesa-pedido-info">
                <div>Pedido #${pedido.id}</div>
                <div>${formatCurrency(pedido.total || 0)}</div>
            </div>`
            : `<div class="mesa-pedido-info">
                ${mesa.status === "livre" ? "Disponível" : 
                  mesa.status === "limpando" ? "Em limpeza" : "Ocupada"}
            </div>`;
    
        let buttonHtml = "";
        if (mesa.status === "limpando") {
            if (authManager.hasAtendimentoPermission()) {
                buttonHtml = `<button class="btn-ver-pedido" data-mesa="${mesa.numero}" data-action="finalize-cleaning">FINALIZAR LIMPEZA</button>`;
            } else {
                buttonHtml = `<button class="btn-ver-pedido btn-disabled" disabled>EM LIMPEZA</button>`;
            }
        } else if (mesa.status === "ocupada") {
            buttonHtml = `<button class="btn-ver-pedido" data-mesa="${mesa.numero}">
                VER PEDIDO
            </button>`;
        } else {
            buttonHtml = `<button class="btn-ver-pedido" data-mesa="${mesa.numero}">
                ${mesa.status === "livre" ? "OCUPAR MESA" : "DETALHES"}
            </button>`;
        }
    
        mesaElement.innerHTML = `
            <div class="mesa-status-badge ${mesa.status}">
                ${mesa.status === "livre" ? "LIVRE" : 
                  mesa.status === "ocupada" ? "OCUPADA" : "LIMPANDO"}
            </div>
            <div class="mesa-number">${mesa.numero}</div>
            ${pedidoInfoHtml}
            ${buttonHtml}
        `;
    
        // ADICIONA EVENT LISTENER CORRETAMENTE
        this.addButtonListeners(mesaElement, mesa);
    
        return mesaElement;
    }

    /**
     * Adiciona listeners aos botões
     */
    addButtonListeners(mesaElement, mesa) {
        const btn = mesaElement.querySelector(".btn-ver-pedido");
        if (!btn || btn.disabled) return;

        // Remove listeners antigos para evitar duplicação
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        // Adiciona novo listener
        newBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const mesaNumero = parseInt(newBtn.getAttribute("data-mesa"));
            const action = newBtn.getAttribute("data-action");
            
            console.log(`Botão clicado: mesa=${mesaNumero}, action=${action}, status=${mesa.status}`);
            
            // Encontra a mesa atualizada (não usa a variável do escopo externo)
            const mesaAtual = dataManager.mesas.find(m => m.numero === mesaNumero);
            if (!mesaAtual) {
                console.error(`Mesa ${mesaNumero} não encontrada`);
                return;
            }
            
            // Executa ação baseada no status
            if (mesaAtual.status === "limpando" && action === "finalize-cleaning") {
                this.finalizeCleaning(mesaNumero);
            } else if (mesaAtual.status === "ocupada") {
                console.log(`Abrindo modal para mesa ${mesaNumero}...`);
                this.showMesaDetails(mesaNumero);
            } else if (mesaAtual.status === "livre") {
                this.ocuparMesa(mesaNumero);
            }
        });
    }

    /**
     * Ocupa mesa
     */
    ocuparMesa(mesaNumero) {
        const mesa = dataManager.mesas.find(m => m.numero === mesaNumero);
        if (!mesa) {
            NotificationSystem.error(`Mesa ${mesaNumero} não encontrada!`);
            return;
        }

        if (mesa.status === "ocupada") {
            this.showMesaDetails(mesaNumero);
            return;
        }

        if (mesa.status === "limpando") {
            NotificationSystem.warning(`Mesa ${mesaNumero} está em limpeza! Aguarde a conclusão.`);
            return;
        }

        NotificationSystem.confirm(`Ocupar Mesa ${mesaNumero}?`, "Ocupar", "Cancelar")
            .then((confirmado) => {
                if (confirmado) {
                    mesa.status = "ocupada";

                    const newOrder = {
                        id: generateOrderId(dataManager.orders),
                        type: "table",
                        tableNumber: mesaNumero,
                        customerName: "",
                        items: [],
                        status: "pending",
                        createdAt: new Date(),
                        subtotal: 0,
                        serviceTax: 0,
                        total: 0,
                        waiter: authManager.getCurrentUser()?.name || null,
                        paymentStatus: "pending",
                    };

                    dataManager.orders.push(newOrder);
                    mesa.pedidoId = newOrder.id;

                    dataManager.saveAppData();
                    this.updateView();

                    setTimeout(() => {
                        this.showMesaDetails(mesaNumero);
                    }, 300);

                    NotificationSystem.success(`Mesa ${mesaNumero} ocupada com sucesso!`);
                }
            });
    }

    /**
     * Mostra detalhes da mesa (ABRE O MODAL)
     */
    showMesaDetails(mesaNumero) {
        console.log(`🔄 TablesManager.showMesaDetails(${mesaNumero}) chamado`);
        
        const mesa = dataManager.mesas.find(m => m.numero === mesaNumero);
        if (!mesa) {
            console.error(`❌ Mesa ${mesaNumero} não encontrada!`);
            NotificationSystem.error(`Mesa ${mesaNumero} não encontrada!`);
            return;
        }

        // Dispara evento para abrir modal - FORÇA COM MAIS DETALHES
        const event = new CustomEvent('showMesaDetails', {
            detail: { 
                mesa,
                mesaNumero: mesa.numero,
                pedidoId: mesa.pedidoId,
                timestamp: new Date().toISOString()
            }
        });
        
        console.log(`📤 Disparando evento showMesaDetails:`, event.detail);
        document.dispatchEvent(event);
        
        // Também tenta abrir diretamente (fallback)
        setTimeout(() => {
            const modal = document.getElementById("mesa-details-modal");
            if (modal && modal.style.display === "none") {
                console.log("Tentando abrir modal diretamente...");
                this.tryOpenModalDirectly(mesa);
            }
        }, 100);
    }

    /**
     * Tenta abrir modal diretamente (fallback)
     */
    tryOpenModalDirectly(mesa) {
        console.log("🔄 Tentando abrir modal diretamente...");
        
        // Verifica se o modalsManager está disponível
        if (window.modalsManager) {
            console.log("Usando modalsManager...");
            window.modalsManager.showMesaDetails(mesa);
            return;
        }
        
        // Tenta abrir manualmente
        const modal = document.getElementById("mesa-details-modal");
        if (modal) {
            modal.style.display = "flex";
            modal.classList.add("active");
            console.log("✅ Modal aberto manualmente");
        } else {
            console.error("❌ Modal não encontrado no DOM!");
        }
    }

    /**
     * Finaliza limpeza
     */
    finalizeCleaning(mesaNumero) {
        if (!authManager.hasAtendimentoPermission()) {
            NotificationSystem.error("Você não tem permissão para finalizar limpeza.");
            return;
        }

        NotificationSystem.confirm(`Finalizar limpeza da Mesa ${mesaNumero}?`, "Finalizar", "Cancelar")
            .then((confirmed) => {
                if (confirmed) {
                    const mesa = dataManager.mesas.find(m => m.numero === mesaNumero);
                    if (mesa) {
                        mesa.status = "livre";
                        dataManager.saveAppData();
                        this.updateView();
                        NotificationSystem.success(`Limpeza da Mesa ${mesaNumero} finalizada.`);
                    }
                }
            });
    }

    /**
     * Filtra mesas por status
     */
    filterByStatus(status) {
        const mesasGrid = document.getElementById("mesas-number-grid");
        if (!mesasGrid) return;

        const mesaCards = mesasGrid.querySelectorAll(".mesa-number-card");

        mesaCards.forEach((card) => {
            const mesaNumero = parseInt(card.querySelector(".mesa-number").textContent);
            const mesa = dataManager.mesas.find(m => m.numero === mesaNumero);

            if (status === "all") {
                card.style.display = "flex";
            } else if (mesa && mesa.status === status) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });

        const count = status === "all" 
            ? dataManager.mesas.length 
            : dataManager.mesas.filter(m => m.status === status).length;

        const header = document.querySelector(".mesas-grid-header h4");
        if (header) {
            header.textContent = 
                status === "all" ? "Mesas Disponíveis" :
                status === "livre" ? `Mesas Livres (${count})` :
                status === "ocupada" ? `Mesas Ocupadas (${count})` :
                `Mesas em Limpeza (${count})`;
        }
    }
}

// Exporta instância singleton e também disponibiliza globalmente
export const tablesManager = new TablesManager();

// Disponibiliza globalmente para debugging
window.tablesManager = tablesManager;