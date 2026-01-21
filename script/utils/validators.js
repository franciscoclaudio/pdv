// ===========================
// VALIDATORS.JS - Validações de Dados
// ===========================

/**
 * Valida credenciais de usuário
 */
export function validateUserCredentials(username, password) {
    const errors = [];
    
    if (!username || username.trim().length === 0) {
        errors.push("Usuário é obrigatório");
    }
    
    if (!password || password.length === 0) {
        errors.push("Senha é obrigatória");
    }
    
    return errors;
}

/**
 * Valida pedido completo
 */
export function validateOrder(order) {
    const errors = [];
    
    if (!order || typeof order !== "object") {
        errors.push("Pedido inválido");
        return errors;
    }
    
    // Valida itens
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
        errors.push("Pedido deve conter pelo menos um item");
    }
    
    // Valida tipo e mesa
    if (order.type === "table" && (!order.tableNumber || order.tableNumber < 1)) {
        errors.push("Número da mesa inválido");
    }
    
    // Valida total
    if (order.total !== undefined && order.total < 0) {
        errors.push("Valor total não pode ser negativo");
    }
    
    // Valida cada item
    if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item, index) => {
            const itemErrors = validateOrderItem(item);
            if (itemErrors.length > 0) {
                errors.push(`Item ${index + 1}: ${itemErrors.join(", ")}`);
            }
        });
    }
    
    return errors;
}

/**
 * Valida item de pedido
 */
export function validateOrderItem(item) {
    const errors = [];
    
    if (!item.productId) {
        errors.push("ID do produto é obrigatório");
    }
    
    if (!item.name || item.name.trim().length === 0) {
        errors.push("Nome do produto é obrigatório");
    }
    
    if (item.price === undefined || item.price < 0) {
        errors.push("Preço inválido");
    }
    
    if (!item.quantity || item.quantity < 1) {
        errors.push("Quantidade inválida");
    }
    
    return errors;
}

/**
 * Valida produto
 */
export function validateProduct(product) {
    const errors = [];
    
    if (!product.name || product.name.trim().length === 0) {
        errors.push("Nome do produto é obrigatório");
    }
    
    if (product.price === undefined || product.price < 0) {
        errors.push("Preço inválido");
    }
    
    if (!product.category || product.category.trim().length === 0) {
        errors.push("Categoria é obrigatória");
    }
    
    return errors;
}

/**
 * Valida dados da aplicação (para backup/restore)
 */
export function validateAppData(data) {
    if (!data || typeof data !== "object") return false;
    if (!Array.isArray(data.orders)) return false;
    if (!Array.isArray(data.mesas)) return false;
    if (!Array.isArray(data.products)) return false;
    
    // Valida estrutura de pedidos
    if (data.orders.length > 0) {
        const sample = data.orders[0];
        if (!sample.id || !sample.items || !Array.isArray(sample.items)) {
            return false;
        }
    }
    
    // Valida estrutura de mesas
    if (data.mesas.length > 0) {
        const sample = data.mesas[0];
        if (typeof sample.numero !== "number" || !sample.status) {
            return false;
        }
    }
    
    return true;
}

/**
 * Valida pagamento
 */
export function validatePayment(paymentData) {
    const errors = [];
    
    if (!paymentData.method) {
        errors.push("Método de pagamento é obrigatório");
    }
    
    if (!paymentData.total || paymentData.total <= 0) {
        errors.push("Valor total inválido");
    }
    
    // Validações específicas por método
    if (paymentData.method === "cash") {
        if (!paymentData.amountReceived || paymentData.amountReceived < paymentData.total) {
            errors.push("Valor recebido é menor que o total");
        }
    }
    
    if (paymentData.method === "meal_voucher") {
        if (!paymentData.voucherCode || paymentData.voucherCode.trim().length === 0) {
            errors.push("Código do vale é obrigatório");
        }
    }
    
    return errors;
}

/**
 * Valida mesa
 */
export function validateTable(tableNumber, totalTables = 15) {
    const errors = [];
    
    if (!tableNumber || tableNumber < 1) {
        errors.push("Número da mesa inválido");
    }
    
    if (tableNumber > totalTables) {
        errors.push(`Mesa ${tableNumber} não existe`);
    }
    
    return errors;
}

/**
 * Valida estoque
 */
export function validateInventory(productId, quantity, inventory) {
    const errors = [];
    
    if (!inventory || inventory.length === 0) {
        return errors; // Sem controle de estoque
    }
    
    const inventoryItem = inventory.find(i => i.productId === productId);
    
    if (!inventoryItem) {
        return errors; // Produto sem controle de estoque
    }
    
    if (inventoryItem.currentStock === 0) {
        errors.push("Produto esgotado");
    }
    
    if (quantity > inventoryItem.currentStock) {
        errors.push(`Estoque insuficiente. Disponível: ${inventoryItem.currentStock}`);
    }
    
    return errors;
}

/**
 * Valida permissão do usuário
 */
export function validatePermission(user, permission) {
    if (!user || !user.permissions) {
        return false;
    }
    
    return user.permissions.includes(permission);
}

/**
 * Valida período de relatório
 */
export function validateReportPeriod(period, startDate, endDate) {
    const errors = [];
    
    if (!period) {
        errors.push("Período é obrigatório");
    }
    
    if (period === "custom") {
        if (!startDate) {
            errors.push("Data inicial é obrigatória");
        }
        
        if (!endDate) {
            errors.push("Data final é obrigatória");
        }
        
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            errors.push("Data inicial não pode ser posterior à data final");
        }
    }
    
    return errors;
}