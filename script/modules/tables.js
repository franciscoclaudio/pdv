// script/modules/tables.js

import { 
    mesas, 
    orders, 
    currentUser 
} from '../utils/constants.js';
import { NotificationSystem } from './notifications.js';
import { DataManager } from './dataManager.js';
import { 
    generateOrderId,
    hasAtendimentoPermission,
    formatCurrency 
} from '../utils/helpers.js';
import { DataValidator } from '../utils/validators.js';
import { showMesaDetails } from './modals.js';
import { updateDashboard } from './dashboard.js';

export function initializeMesas() {
    if (!currentUser || !currentUser.permissions.includes("mesas")) {
        const mesasTab = document.querySelector('.nav-item[data-tab="mesas"]');
        if (mesasTab) mesasTab.style.display = "none";
        return;
    }

    // Garantir que temos pelo menos 15 mesas
    while (mesas.length < 15) {
        const nextNumero = mesas.length + 1;
        mesas.push({
            numero: nextNumero,
            status: "livre",
            pedidoId: null,
        });
    }

    // Configurar filtro de mesas
    const filterMesas = document.getElementById("filter-mesas");
    if (filterMesas) {
        filterMesas.addEventListener("change", function() {
            filterMesasByStatus(this.value);
        });
    }

    updateMesasView();

    // Configurar mesas de exemplo se necessário
    setupExampleMesas();
}

export function updateMesasView() {
    updateMesasStatsCards();
    updateMesasNumberGrid();
    updateGarcomInfo();
}

function updateMesasStatsCards() {
    const totalMesas = mesas.length;
    const mesasLivres = mesas.filter((m) => m.status === "livre").length;
    const mesasOcupadas = mesas.filter((m) => m.status === "ocupada").length;
    const mesasLimpando = mesas.filter((m) => m.status === "limpando").length;

    const totalEl = document.getElementById("mesas-total-count");
    const livresEl = document.getElementById("mesas-livres-count");
    const ocupadasEl = document.getElementById("mesas-ocupadas-count");
    const limpandoEl = document.getElementById("mesas-limpando-count");

    if (totalEl) totalEl.textContent = totalMesas;
    if (livresEl) livresEl.textContent = mesasLivres;
    if (ocupadasEl) ocupadasEl.textContent = mesasOcupadas;
    if (limpandoEl) limpandoEl.textContent = mesasLimpando;
}

function updateMesasNumberGrid() {
    const mesasGrid = document.getElementById("mesas-number-grid");
    if (!mesasGrid) return;

    mesasGrid.innerHTML = "";

    mesas.forEach((mesa) => {
        const mesaElement = createMesaCard(mesa);
        mesasGrid.appendChild(mesaElement);
    });
}

function createMesaCard(mesa) {
    const mesaElement = document.createElement("div");
    mesaElement.className = `mesa-number-card ${mesa.status}`;
    mesaElement.dataset.mesa = mesa.numero;

    const pedido = mesa.pedidoId ? orders.find((o) => o.id === mesa.pedidoId) : null;

    // Informações do pedido
    const pedidoInfoHtml = getMesaPedidoInfo(mesa, pedido);
    
    // Botão de ação
    const buttonHtml = getMesaActionButton(mesa, pedido);

    mesaElement.innerHTML = `
        <div class="mesa-status-badge ${mesa.status}">
            ${getMesaStatusText(mesa.status)}
        </div>
        <div class="mesa-number">${mesa.numero}</div>
        ${pedidoInfoHtml}
        ${buttonHtml}
    `;

    // Event listeners
    setupMesaCardEvents(mesaElement, mesa, pedido);

    return mesaElement;
}

function getMesaPedidoInfo(mesa, pedido) {
    if (mesa.status === "ocupada" && pedido) {
        return `
            <div class="mesa-pedido-info">
                <div class="mesa-pedido-id">Pedido #${pedido.id}</div>
                <div class="mesa-pedido-total">${formatCurrency(pedido.total || 0)}</div>
                <div class="mesa-pedido-time">${formatTime(pedido.createdAt)}</div>
                ${pedido.customerName ? `<div class="mesa-pedido-cliente">${pedido.customerName}</div>` : ''}
            </div>
        `;
    }
    
    return `
        <div class="mesa-pedido-info">
            ${getMesaStatusDescription(mesa.status)}
        </div>
    `;
}

function getMesaActionButton(mesa, pedido) {
    if (mesa.status === "limpando") {
        if (hasAtendimentoPermission()) {
            return `<button class="btn-ver-pedido" data-action="finalize-cleaning">FINALIZAR LIMPEZA</button>`;
        } else {
            return `<button class="btn-ver-pedido btn-disabled" disabled>EM LIMPEZA</button>`;
        }
    } else if (mesa.status === "ocupada" && pedido) {
        return `<button class="btn-ver-pedido" data-pedido="${pedido.id}">VER PEDIDO</button>`;
    } else if (mesa.status === "livre") {
        return `<button class="btn-ver-pedido">OCUPAR MESA</button>`;
    } else {
        return `<button class="btn-ver-pedido">DETALHES</button>`;
    }
}

function getMesaStatusText(status) {
    const statusMap = {
        livre: "LIVRE",
        ocupada: "OCUPADA",
        limpando: "LIMPANDO"
    };
    return statusMap[status] || status.toUpperCase();
}

function getMesaStatusDescription(status) {
    const descriptions = {
        livre: "Disponível",
        ocupada: "Ocupada",
        limpando: "Em limpeza"
    };
    return descriptions[status] || status;
}

function setupMesaCardEvents(mesaElement, mesa, pedido) {
    // Clique na mesa
    mesaElement.addEventListener("click", function (e) {
        if (e.target.classList.contains("btn-disabled")) {
            e.stopPropagation();
            NotificationSystem.show(`Mesa ${mesa.numero} está em limpeza no momento.`, "info");
            return;
        }

        if (!e.target.classList.contains("btn-ver-pedido")) {
            handleMesaClick(mesa);
        }
    });

    // Clique no botão
    const verPedidoBtn = mesaElement.querySelector(".btn-ver-pedido");
    if (verPedidoBtn) {
        verPedidoBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            const action = this.dataset.action;
            
            if (action === "finalize-cleaning") {
                finalizeCleaning(mesa.numero);
                return;
            }

            handleMesaClick(mesa);
        });
    }
}

function handleMesaClick(mesa) {
    switch (mesa.status) {
        case "ocupada":
            showMesaDetails(mesa.numero);
            break;
        case "livre":
            ocuparMesa(mesa.numero);
            break;
        case "limpando":
            if (hasAtendimentoPermission()) {
                NotificationSystem.confirm(
                    `Finalizar limpeza da Mesa ${mesa.numero}?`, 
                    "Finalizar", 
                    "Cancelar"
                ).then((ok) => {
                    if (ok) {
                        mesa.status = "livre";
                        DataManager.saveAppData();
                        updateMesasView();
                        NotificationSystem.show(`Limpeza da Mesa ${mesa.numero} finalizada.`, "success");
                    }
                });
            } else {
                NotificationSystem.show(`Mesa ${mesa.numero} está em limpeza no momento.`, "info");
            }
            break;
    }
}

export function ocuparMesa(mesaNumero) {
    const mesa = mesas.find((m) => m.numero === mesaNumero);
    if (!mesa) {
        NotificationSystem.show(`Mesa ${mesaNumero} não encontrada!`, "error");
        return;
    }

    if (mesa.status === "ocupada") {
        showMesaDetails(mesaNumero);
        return;
    }

    if (mesa.status === "limpando") {
        NotificationSystem.show(`Mesa ${mesaNumero} está em limpeza! Aguarde a conclusão.`, "warning");
        return;
    }

    NotificationSystem.confirm(
        `Ocupar Mesa ${mesaNumero}?`, 
        "Ocupar", 
        "Cancelar"
    ).then((confirmado) => {
        if (confirmado) {
            mesa.status = "ocupada";

            const newOrder = {
                id: generateOrderId(),
                type: "table",
                tableNumber: mesaNumero,
                customerName: "",
                items: [],
                status: "pending",
                createdAt: new Date(),
                subtotal: 0,
                serviceTax: 0,
                total: 0,
                waiter: currentUser ? currentUser.name : null,
                paymentStatus: "pending",
            };

            orders.push(newOrder);
            mesa.pedidoId = newOrder.id;

            DataManager.saveAppData();
            updateMesasView();

            setTimeout(() => {
                showMesaDetails(mesaNumero);
            }, 300);

            NotificationSystem.show(`Mesa ${mesaNumero} ocupada com sucesso!`, "success");
        }
    });
}

function finalizeCleaning(mesaNumero) {
    if (!hasAtendimentoPermission()) {
        NotificationSystem.show("Você não tem permissão para finalizar a limpeza.", "error");
        return;
    }

    NotificationSystem.confirm(
        `Finalizar limpeza da Mesa ${mesaNumero}?`, 
        "Finalizar", 
        "Cancelar"
    ).then((ok) => {
        if (ok) {
            const m = mesas.find((mm) => mm.numero === mesaNumero);
            if (m) {
                m.status = "livre";
                DataManager.saveAppData();
                updateMesasView();
                NotificationSystem.show(`Limpeza da Mesa ${mesaNumero} finalizada.`, "success");
            }
        }
    });
}

function filterMesasByStatus(status) {
    const mesasGrid = document.getElementById("mesas-number-grid");
    if (!mesasGrid) return;

    const mesaCards = mesasGrid.querySelectorAll(".mesa-number-card");

    mesaCards.forEach((card) => {
        const mesaNumero = parseInt(card.querySelector(".mesa-number").textContent);
        const mesa = mesas.find((m) => m.numero === mesaNumero);

        if (status === "all") {
            card.style.display = "flex";
        } else if (mesa && mesa.status === status) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });

    const count = status === "all" ? mesas.length : mesas.filter((m) => m.status === status).length;
    const header = document.querySelector(".mesas-grid-header h4");
    if (header) {
        header.textContent = getFilterHeaderText(status, count);
    }
}

function getFilterHeaderText(status, count) {
    switch (status) {
        case "all": return "Mesas Disponíveis";
        case "livre": return `Mesas Livres (${count})`;
        case "ocupada": return `Mesas Ocupadas (${count})`;
        case "limpando": return `Mesas em Limpeza (${count})`;
        default: return "Mesas Disponíveis";
    }
}

function updateGarcomInfo() {
    if (currentUser && (currentUser.profile === "garcom" || currentUser.profile === "gestor")) {
        const garcomAvatar = document.querySelector(".garcom-avatar");
        const garcomName = document.querySelector(".garcom-name");
        const garcomRole = document.querySelector(".garcom-role");
        const garcomSetor = document.querySelector(".garcom-setor");

        if (garcomAvatar) {
            const initials = currentUser.name.split(" ").map((n) => n[0]).join("").substring(0, 2);
            garcomAvatar.textContent = initials;
        }

        if (garcomName) garcomName.textContent = currentUser.name;
        if (garcomRole) garcomRole.textContent = getProfileDisplayName(currentUser.profile);
        if (garcomSetor) garcomSetor.textContent = "Salão";
    }
}

function getProfileDisplayName(profile) {
    const profiles = {
        garcom: "Garçom",
        caixa: "Caixa",
        cozinha: "Cozinha",
        gestor: "Gestor"
    };
    return profiles[profile] || profile;
}

function setupExampleMesas() {
    // Configurar algumas mesas de exemplo
    if (mesas.length >= 3 && !mesas.some(m => m.status === "limpando")) {
        mesas[2].status = "limpando";
    }
    
    // Configurar algumas mesas como ocupadas para exemplo
    if (mesas.length >= 5) {
        [0, 4].forEach(index => {
            if (mesas[index].status === "livre") {
                mesas[index].status = "ocupada";
                // Criar pedido de exemplo
                const orderId = generateOrderId();
                mesas[index].pedidoId = orderId;
                
                orders.push({
                    id: orderId,
                    type: "table",
                    tableNumber: mesas[index].numero,
                    customerName: "Cliente Exemplo",
                    items: [
                        { productId: 1, name: "Pizza Margherita", price: 29.95, quantity: 1 },
                        { productId: 5, name: "Refrigerante", price: 5.0, quantity: 2 }
                    ],
                    status: "pending",
                    createdAt: new Date(),
                    subtotal: 39.95,
                    serviceTax: 3.995,
                    total: 43.945,
                    waiter: "João Silva",
                    paymentStatus: "pending",
                });
            }
        });
    }
}

// Exportar funções para uso externo
export function getMesaByNumero(numero) {
    return mesas.find(m => m.numero === numero);
}

export function getPedidoFromMesa(mesaNumero) {
    const mesa = getMesaByNumero(mesaNumero);
    if (!mesa || !mesa.pedidoId) return null;
    return orders.find(o => o.id === mesa.pedidoId);
}

export function liberarMesa(mesaNumero) {
    const mesa = getMesaByNumero(mesaNumero);
    if (!mesa) return false;
    
    mesa.status = "livre";
    mesa.pedidoId = null;
    
    DataManager.saveAppData();
    updateMesasView();
    updateDashboard();
    
    return true;
}