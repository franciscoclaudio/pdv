// script/utils/validators.js

export class DataValidator {
    static validateOrder(order) {
        const errors = [];
        if (!order || typeof order !== "object") {
            errors.push("Pedido inválido");
            return errors;
        }
        if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
            errors.push("Pedido deve conter pelo menos um item");
        }
        if (order.type === "table" && (!order.tableNumber || order.tableNumber < 1)) {
            errors.push("Número da mesa inválido");
        }
        if (order.total !== undefined && order.total < 0) {
            errors.push("Valor total não pode ser negativo");
        }
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item, index) => {
                if (!item.productId || !item.name || item.price === undefined || !item.quantity) {
                    errors.push(`Item ${index + 1} está incompleto`);
                }
                if (item.quantity < 1) {
                    errors.push(`Quantidade inválida: ${item.name}`);
                }
                if (item.price < 0) {
                    errors.push(`Preço inválido: ${item.name}`);
                }
            });
        }
        return errors;
    }

    static validateProduct(product) {
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

    static validateUserCredentials(username, password) {
        const errors = [];
        if (!username || username.trim().length === 0) {
            errors.push("Usuário é obrigatório");
        }
        if (!password || password.length === 0) {
            errors.push("Senha é obrigatória");
        }
        return errors;
    }
}