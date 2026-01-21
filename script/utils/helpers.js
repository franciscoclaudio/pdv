// ===========================
// HELPERS.JS - Funções Auxiliares
// ===========================

import { 
    STATUS_LABELS, 
    PAYMENT_STATUS_LABELS, 
    ORDER_TYPE_LABELS, 
    PROFILE_LABELS, 
    TAB_LABELS 
} from './constants.js';

// ===========================
// Função ÚNICA para todas as imagens
// ===========================

export function renderProductImage(image, altText) {
    // DIMENSÕES FIXAS PARA TODAS AS IMAGENS - 145x145 px
    const IMAGE_WIDTH = '145px';    // Largura FIXA igual para todos
    const IMAGE_HEIGHT = '145px';   // Altura FIXA igual para todos
    const EMOJI_SIZE = '3em';       // Tamanho do emoji
    
    // Validação básica
    if (!image || typeof image !== 'string' || image.trim() === '') {
        return `
            <div class="product-image-fixed" 
                 style="width: ${IMAGE_WIDTH}; height: ${IMAGE_HEIGHT}; display: flex; align-items: center; justify-content: center; font-size: ${EMOJI_SIZE}; background: #f8f9fa; border-radius: 10px; overflow: hidden;">
                📦
            </div>
        `;
    }
    
    const imageStr = image.trim();
    
    // Verifica se é emoji (caractere simples, não caminho)
    const isEmoji = imageStr.length <= 3 && 
                   !imageStr.includes('.') && 
                   !imageStr.includes('/') && 
                   !imageStr.includes(':') &&
                   !imageStr.startsWith('http');
    
    // Se for emoji
    if (isEmoji) {
        return `
            <div class="product-image-fixed" 
                 style="width: ${IMAGE_WIDTH}; height: ${IMAGE_HEIGHT}; display: flex; align-items: center; justify-content: center; font-size: ${EMOJI_SIZE}; background: #f8f9fa; border-radius: 10px; overflow: hidden;">
                ${imageStr}
            </div>
        `;
    }
    
    // Se for base64 (imagem carregada)
    if (imageStr.startsWith('data:image/')) {
        return `
            <img src="${imageStr}" 
                 alt="${altText || 'Produto'}" 
                 class="product-image-fixed" 
                 style="width: ${IMAGE_WIDTH}; height: ${IMAGE_HEIGHT}; object-fit: cover; border-radius: 10px; display: block;"
                 onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div style=\\'width: ${IMAGE_WIDTH}; height: ${IMAGE_HEIGHT}; display: flex; align-items: center; justify-content: center; font-size: ${EMOJI_SIZE}; background: #f8f9fa; border-radius: 10px; overflow: hidden;\\'>📦</div>'">
        `;
    }
    
    // É caminho de imagem (URL ou arquivo)
    return `
        <img src="${imageStr}" 
             alt="${altText || 'Produto'}" 
             class="product-image-fixed" 
             style="width: ${IMAGE_WIDTH}; height: ${IMAGE_HEIGHT}; object-fit: cover; border-radius: 10px; display: block;"
             onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div style=\\'width: ${IMAGE_WIDTH}; height: ${IMAGE_HEIGHT}; display: flex; align-items: center; justify-content: center; font-size: ${EMOJI_SIZE}; background: #f8f9fa; border-radius: 10px; overflow: hidden;\\'>📦</div>'">
    `;
}

/**
 * Formata valores monetários
 */
export function formatCurrency(value) {
    return `R$ ${parseFloat(value).toFixed(2)}`;
}

/**
 * Formata horário
 */
export function formatTime(date) {
    return new Date(date).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

/**
 * Formata data completa
 */
export function formatDate(date) {
    return new Date(date).toLocaleDateString("pt-BR");
}

/**
 * Formata data e hora
 */
export function formatDateTime(date) {
    return new Date(date).toLocaleString("pt-BR");
}

/**
 * Retorna texto do status do pedido
 */
export function getStatusText(status) {
    return STATUS_LABELS[status] || status;
}

/**
 * Retorna texto do status de pagamento
 */
export function getPaymentStatusText(status) {
    return PAYMENT_STATUS_LABELS[status] || status;
}

/**
 * Retorna texto do tipo de pedido
 */
export function getOrderTypeText(type) {
    return ORDER_TYPE_LABELS[type] || type;
}

/**
 * Retorna nome de exibição do perfil
 */
export function getProfileDisplayName(profile) {
    return PROFILE_LABELS[profile] || profile;
}

/**
 * Retorna nome de exibição da aba
 */
export function getTabDisplayName(tabId) {
    return TAB_LABELS[tabId] || tabId;
}

/**
 * Gera ID único para pedido
 */
export function generateOrderId(orders = []) {
    return orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1001;
}

/**
 * Gera ID único para produto
 */
export function generateProductId(products = []) {
    return products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
}

/**
 * Calcula subtotal de um pedido
 */
export function calculateSubtotal(items) {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Calcula taxa de serviço
 */
export function calculateServiceTax(subtotal, rate = 0.1) {
    return subtotal * rate;
}

/**
 * Calcula total do pedido
 */
export function calculateTotal(items, serviceTaxRate = 0.1) {
    const subtotal = calculateSubtotal(items);
    const serviceTax = calculateServiceTax(subtotal, serviceTaxRate);
    return subtotal + serviceTax;
}

/**
 * Obtém iniciais do nome
 */
export function getInitials(name) {
    return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
}

/**
 * Escapa HTML para evitar XSS
 */
export function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Verifica se data é hoje
 */
export function isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.toDateString() === today.toDateString();
}

/**
 * Filtra pedidos por data
 */
export function filterOrdersByDate(orders, period) {
    const now = new Date();
    
    switch(period) {
        case "today":
            return orders.filter(o => isToday(o.createdAt));
        
        case "yesterday":
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return orders.filter(o => 
                new Date(o.createdAt).toDateString() === yesterday.toDateString()
            );
        
        case "week":
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orders.filter(o => new Date(o.createdAt) >= weekAgo);
        
        case "month":
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return orders.filter(o => new Date(o.createdAt) >= monthAgo);
        
        default:
            return orders;
    }
}

/**
 * Agrupa itens por categoria
 */
export function groupByCategory(items) {
    return items.reduce((groups, item) => {
        const category = item.category || "Sem Categoria";
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(item);
        return groups;
    }, {});
}

/**
 * Clona objeto profundamente
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Verifica se objeto está vazio
 */
export function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

/**
 * Remove acentos de string
 */
export function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Busca em array de objetos (case-insensitive, sem acentos)
 */
export function searchInArray(array, searchTerm, fields = []) {
    const term = removeAccents(searchTerm.toLowerCase());
    
    return array.filter(item => {
        return fields.some(field => {
            const value = item[field];
            if (!value) return false;
            return removeAccents(String(value).toLowerCase()).includes(term);
        });
    });
}

/**
 * Ordena array por campo
 */
export function sortBy(array, field, order = 'asc') {
    return [...array].sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Trunca texto
 */
export function truncate(str, length = 50) {
    return str.length > length ? str.substring(0, length) + '...' : str;
}

/**
 * Valida email
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Valida CPF (básico)
 */
export function isValidCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    return cpf.length === 11;
}

/**
 * Formata CPF
 */
export function formatCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata telefone
 */
export function formatPhone(phone) {
    phone = phone.replace(/[^\d]/g, '');
    if (phone.length === 11) {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}