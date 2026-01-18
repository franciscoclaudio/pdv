// script/utils/helpers.js

export function formatTime(date) {
    return new Date(date).toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"});
}

export function generateOrderId() {
    return orders.length > 0 ? Math.max(...orders.map((o) => o.id)) + 1 : 1001;
}

export function getProfileDisplayName(profile) {
    const profiles = {garcom: "Garçom", caixa: "Caixa", cozinha: "Cozinha", gestor: "Gestor"};
    return profiles[profile] || profile;
}

export function getTabDisplayName(tabId) {
    const names = {
        dashboard: "Dashboard",
        pdv: "PDV",
        pedidos: "Balcão",
        cozinha: "Cozinha",
        mesas: "Mesas",
        relatorios: "Relatórios",
        produtos: "Produtos",
    };
    return names[tabId] || tabId;
}

export function getOrderTypeText(type) {
    const types = {table: "Mesa", counter: "Balcão", delivery: "Delivery"};
    return types[type] || type;
}

export function getPaymentStatusText(status) {
    const statusMap = {pending: "Pendente", paid: "Pago", closed: "Mesa Finalizada"};
    return statusMap[status] || status;
}

export function getStatusText(status) {
    const statusMap = {
        pending: "Pendente",
        preparing: "Preparando",
        ready: "Pronto",
        delivered: "Entregue",
        paid: "Pago",
    };
    return statusMap[status] || status;
}