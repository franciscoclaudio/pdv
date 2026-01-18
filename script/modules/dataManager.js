// script/modules/dataManager.js

import { LocalStorageHelper } from '../utils/LocalStorageHelper.js';
import { orders, mesas, products, inventory, comandas } from '../utils/constants.js';
import { NotificationSystem } from './notifications.js';

export class DataManager {
    static saveAppData() {
        const appData = {
            orders: orders,
            mesas: mesas,
            products: products,
            inventory: inventory,
            comandas: comandas,
            lastUpdate: new Date().toISOString(),
            version: "1.0",
        };

        try {
            const success = LocalStorageHelper.setItem("pdvAppData", appData);
            if (success) {
                console.log("✓ Dados salvos:", new Date().toLocaleTimeString());
            }
            return success;
        } catch (error) {
            console.error("Erro ao salvar dados:", error);
            NotificationSystem.show("Erro ao salvar dados localmente", "error");
            return false;
        }
    }

    static loadAppData() {
        try {
            const data = LocalStorageHelper.getItem("pdvAppData");
            if (!data) {
                console.log("Usando dados padrão");
                return false;
            }

            if (!this.validateAppData(data)) {
                console.error("Dados inválidos");
                NotificationSystem.show("Dados corrompidos. Usando dados padrão.", "warning");
                return false;
            }

            // Atualizar arrays globais
            orders.length = 0;
            orders.push(...(data.orders || []).map(o => {
                o.createdAt = o.createdAt ? new Date(o.createdAt) : new Date();
                o.updatedAt = o.updatedAt ? new Date(o.updatedAt) : o.updatedAt;
                o.paymentDate = o.paymentDate ? new Date(o.paymentDate) : o.paymentDate;
                return o;
            }));

            mesas.length = 0;
            mesas.push(...(data.mesas || []));

            products.length = 0;
            products.push(...(data.products || []));

            inventory.length = 0;
            inventory.push(...(data.inventory || []));

            comandas.length = 0;
            comandas.push(...(data.comandas || []));

            // Garantir que temos pelo menos 15 mesas
            while (mesas.length < 15) {
                mesas.push({
                    numero: mesas.length + 1,
                    status: "livre",
                    pedidoId: null
                });
            }

            console.log("✓ Dados carregados:", {
                orders: orders.length,
                mesas: mesas.length,
                products: products.length,
                inventory: inventory.length
            });
            return true;
        } catch (error) {
            console.error("Erro ao carregar:", error);
            return false;
        }
    }

    static validateAppData(data) {
        if (!data || typeof data !== "object") return false;
        if (!Array.isArray(data.orders)) return false;
        if (!Array.isArray(data.mesas)) return false;
        if (!Array.isArray(data.products)) return false;

        if (data.orders.length > 0) {
            const sample = data.orders[0];
            if (!sample.id || !sample.items || !Array.isArray(sample.items)) return false;
        }

        if (data.mesas.length > 0) {
            const sample = data.mesas[0];
            if (typeof sample.numero !== "number" || !sample.status) return false;
        }

        if (data.products.length > 0) {
            const sample = data.products[0];
            if (!sample.name || sample.price === undefined) return false;
        }

        return true;
    }

    static exportData() {
        const data = {
            orders: orders,
            mesas: mesas,
            products: products,
            inventory: inventory,
            comandas: comandas,
            exportDate: new Date().toISOString(),
            totalOrders: orders.length,
            totalSales: orders.reduce((sum, order) => sum + (order.total || 0), 0),
            version: "1.0",
        };

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_pdv_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        NotificationSystem.show("Backup exportado com sucesso!", "success");
    }

    static importData(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);

                if (!DataManager.validateAppData(data)) {
                    NotificationSystem.show("Arquivo de backup inválido", "error");
                    return;
                }

                NotificationSystem.confirm(
                    "Deseja substituir os dados atuais? Esta ação não pode ser desfeita.",
                    "Importar",
                    "Cancelar"
                ).then((confirmed) => {
                    if (confirmed) {
                        // Limpar arrays existentes
                        orders.length = 0;
                        mesas.length = 0;
                        products.length = 0;
                        inventory.length = 0;
                        comandas.length = 0;

                        // Adicionar novos dados
                        orders.push(...(data.orders || []));
                        mesas.push(...(data.mesas || []));
                        products.push(...(data.products || []));
                        inventory.push(...(data.inventory || []));
                        comandas.push(...(data.comandas || []));

                        DataManager.saveAppData();
                        NotificationSystem.show("Dados importados com sucesso!", "success");

                        // Disparar evento para atualizar views
                        window.dispatchEvent(new CustomEvent('dataUpdated'));
                    }
                });
            } catch (error) {
                NotificationSystem.show("Erro: arquivo corrompido", "error");
                console.error("Erro na importação:", error);
            }
        };
        reader.onerror = () => NotificationSystem.show("Erro ao ler arquivo", "error");
        reader.readAsText(file);
    }

    static getOrderById(orderId) {
        return orders.find(order => order.id === orderId);
    }

    static getMesaByNumero(numero) {
        return mesas.find(mesa => mesa.numero === numero);
    }

    static getProductById(productId) {
        return products.find(product => product.id === productId);
    }

    static getOrdersByStatus(status) {
        return orders.filter(order => order.status === status);
    }

    static getOrdersByDate(date) {
        const targetDate = new Date(date).toDateString();
        return orders.filter(order => new Date(order.createdAt).toDateString() === targetDate);
    }
}