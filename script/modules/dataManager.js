// ===========================
// DATA MANAGER - Gerenciamento de Dados (COMPLETO)
// ===========================

import { STORAGE_KEYS, CONFIG } from '../utils/constants.js';
import { validateAppData } from '../utils/validators.js';
import { NotificationSystem } from './notifications.js';

/**
 * Helper para LocalStorage
 */
class LocalStorageHelper {
    static isAvailable() {
        try {
            const test = "__localStorage_test__";
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    static setItem(key, value) {
        if (!this.isAvailable()) {
            console.warn("localStorage não disponível");
            return false;
        }
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.error("Erro ao salvar:", e);
            return false;
        }
    }

    static getItem(key) {
        if (!this.isAvailable()) return null;
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    static removeItem(key) {
        if (!this.isAvailable()) return false;
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    }
}

/**
 * Gerenciador de dados da aplicação
 */
export class DataManager {
    constructor() {
        this.orders = [];
        this.mesas = [];
        this.products = [];
        this.inventory = [];
        this.comandas = [];
        this.employees = [];
        this.caixa = {
            status: "fechado",
            abertura: null,
            fechamento: null,
            saldoInicial: 0,
            saldoFinal: 0,
            responsavelAbertura: null,
            responsavelFechamento: null,
            resumo: null,
            movimentacoes: []
        };
    }

    /**
     * Salva dados da aplicação
     */
    saveAppData() {
        const appData = {
            orders: this.orders,
            mesas: this.mesas,
            products: this.products,
            inventory: this.inventory,
            comandas: this.comandas,
            employees: this.employees,
            caixa: this.caixa,
            lastUpdate: new Date().toISOString(),
            version: CONFIG.APP_VERSION,
        };

        try {
            const success = LocalStorageHelper.setItem(
                STORAGE_KEYS.APP_DATA, 
                JSON.stringify(appData)
            );
            
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

    /**
     * Carrega dados da aplicação
     */
    loadAppData() {
        try {
            const saved = LocalStorageHelper.getItem(STORAGE_KEYS.APP_DATA);
            
            if (!saved) {
                console.log("Usando dados padrão");
                return false;
            }

            const data = JSON.parse(saved);

            if (!validateAppData(data)) {
                console.error("Dados inválidos");
                NotificationSystem.show("Dados corrompidos. Usando dados padrão.", "warning");
                return false;
            }

            // Restaura pedidos com conversão de datas
            this.orders = Array.isArray(data.orders) ? data.orders.map(o => ({
                ...o,
                createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
                updatedAt: o.updatedAt ? new Date(o.updatedAt) : null,
                paymentDate: o.paymentDate ? new Date(o.paymentDate) : null
            })) : [];

            this.mesas = Array.isArray(data.mesas) && data.mesas.length > 0 
                ? data.mesas 
                : this.initializeTables();
                
            this.products = Array.isArray(data.products) && data.products.length > 0 
                ? data.products 
                : [];
                
            this.inventory = Array.isArray(data.inventory) ? data.inventory : [];
            this.comandas = Array.isArray(data.comandas) ? data.comandas : [];
            this.employees = Array.isArray(data.employees) ? data.employees : [];
            
            // Carrega dados do caixa ou inicializa padrão
            this.caixa = data.caixa || {
                status: "fechado",
                abertura: null,
                fechamento: null,
                saldoInicial: 0,
                saldoFinal: 0,
                responsavelAbertura: null,
                responsavelFechamento: null,
                resumo: null,
                movimentacoes: []
            };

            // Garante mesas mínimas
            while (this.mesas.length < CONFIG.TOTAL_TABLES) {
                this.mesas.push({
                    numero: this.mesas.length + 1,
                    status: "livre",
                    pedidoId: null
                });
            }

            console.log("✓ Dados carregados:", {
                orders: this.orders.length,
                mesas: this.mesas.length,
                products: this.products.length,
                employees: this.employees.length,
                caixaStatus: this.caixa.status
            });
            
            return true;
        } catch (error) {
            console.error("Erro ao carregar:", error);
            return false;
        }
    }

    /**
     * Inicializa mesas vazias
     */
    initializeTables() {
        return Array.from({length: CONFIG.TOTAL_TABLES}, (_, i) => ({
            numero: i + 1,
            status: "livre",
            pedidoId: null
        }));
    }

    /**
     * Exporta backup dos dados
     */
    exportData() {
        const data = {
            orders: this.orders,
            mesas: this.mesas,
            products: this.products,
            inventory: this.inventory,
            comandas: this.comandas,
            employees: this.employees,
            caixa: this.caixa,
            exportDate: new Date().toISOString(),
            totalOrders: this.orders.length,
            totalSales: this.orders.reduce((sum, order) => sum + (order.total || 0), 0),
            version: CONFIG.APP_VERSION,
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

    /**
     * Importa backup
     */
    importData(file, onSuccess) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (!validateAppData(data)) {
                    NotificationSystem.show("Arquivo de backup inválido", "error");
                    return;
                }

                NotificationSystem.confirm(
                    "Deseja substituir os dados atuais? Esta ação não pode ser desfeita.",
                    "Importar",
                    "Cancelar"
                ).then((confirmed) => {
                    if (confirmed) {
                        this.orders = data.orders || [];
                        this.mesas = data.mesas || this.initializeTables();
                        this.products = data.products || [];
                        this.inventory = data.inventory || [];
                        this.comandas = data.comandas || [];
                        this.employees = data.employees || [];
                        this.caixa = data.caixa || {
                            status: "fechado",
                            abertura: null,
                            fechamento: null,
                            saldoInicial: 0,
                            saldoFinal: 0,
                            responsavelAbertura: null,
                            responsavelFechamento: null,
                            resumo: null,
                            movimentacoes: []
                        };

                        this.saveAppData();
                        
                        if (onSuccess) {
                            onSuccess();
                        }

                        NotificationSystem.show("Dados importados com sucesso!", "success");
                    }
                });
            } catch (error) {
                NotificationSystem.show("Erro: arquivo corrompido", "error");
                console.error("Erro na importação:", error);
            }
        };
        
        reader.onerror = () => {
            NotificationSystem.show("Erro ao ler arquivo", "error");
        };
        
        reader.readAsText(file);
    }

    /**
     * Limpa todos os dados
     */
    clearAllData() {
        this.orders = [];
        this.mesas = this.initializeTables();
        this.products = [];
        this.inventory = [];
        this.comandas = [];
        this.employees = [];
        this.caixa = {
            status: "fechado",
            abertura: null,
            fechamento: null,
            saldoInicial: 0,
            saldoFinal: 0,
            responsavelAbertura: null,
            responsavelFechamento: null,
            resumo: null,
            movimentacoes: []
        };
        this.saveAppData();
    }

    /**
     * Obtém estatísticas gerais
     */
    getStats() {
        const totalOrders = this.orders.length;
        const totalSales = this.orders
            .filter(o => o.paymentStatus === "paid" || o.paymentStatus === "closed")
            .reduce((sum, o) => sum + (o.total || 0), 0);
        
        const occupiedTables = this.mesas.filter(m => m.status === "ocupada").length;
        
        return {
            totalOrders,
            totalSales,
            totalProducts: this.products.length,
            totalTables: this.mesas.length,
            occupiedTables
        };
    }

    /**
     * ==========================================
     * MÉTODOS PARA GERENCIAMENTO DE CAIXA
     * ==========================================
     */

    /**
     * Abre o caixa com saldo inicial
     */
    abrirCaixa(saldoInicial, responsavel) {
        if (this.caixa.status === "aberto") {
            return false;
        }

        this.caixa = {
            status: "aberto",
            abertura: new Date().toISOString(),
            fechamento: null,
            saldoInicial: saldoInicial,
            saldoFinal: 0,
            responsavelAbertura: responsavel,
            responsavelFechamento: null,
            resumo: null,
            movimentacoes: []
        };
        
        this.saveAppData();
        return true;
    }
    // No arquivo dataManager.js, dentro da classe DataManager

    fecharCaixaComDetalhes(dadosFechamento, responsavel) {
        console.log("DEBUG dataManager: fecharCaixaComDetalhes chamado", dadosFechamento);
        
        if (this.caixa.status !== "aberto") {
            console.error("DEBUG: Caixa não está aberto, status:", this.caixa.status);
            return false;
        }
        
        try {
            // Fecha o caixa
            this.caixa.status = "fechado";
            this.caixa.fechamento = new Date().toISOString();
            this.caixa.responsavelFechamento = responsavel;
            
            // Salva o saldo final total (soma de todos os métodos)
            this.caixa.saldoFinal = dadosFechamento.totalInformado;
            
            // Salvar detalhes do fechamento por forma de pagamento
            this.caixa.detalhesFechamento = {
                ...dadosFechamento,
                dataFechamento: new Date().toISOString(),
                responsavel: responsavel,
                statusCaixa: "fechado"
            };
            
            // Registrar histórico de fechamento
            if (!this.caixa.historicoFechamentos) {
                this.caixa.historicoFechamentos = [];
            }
            
            this.caixa.historicoFechamentos.push({
                ...this.caixa.detalhesFechamento,
                abertura: this.caixa.abertura,
                saldoInicial: this.caixa.saldoInicial,
                movimentacoes: [...(this.caixa.movimentacoes || [])],
                quantidadePedidos: this.getResumoCaixa().quantidadePedidos,
                totalVendas: this.getResumoCaixa().totalVendas
            });
            
            // Limpar movimentações para próximo caixa
            this.caixa.movimentacoes = [];
            
            // Salvar dados
            this.saveAppData();
            
            console.log("DEBUG dataManager: Caixa fechado com sucesso");
            return true;
            
        } catch (error) {
            console.error("Erro ao fechar caixa com detalhes:", error);
            return false;
        }
    }

    // Se o método fecharCaixa simples também não existir, adicione este também:
    fecharCaixa(saldoFinal, responsavel) {
        console.log("DEBUG dataManager: fecharCaixa simples chamado", saldoFinal);
        
        if (this.caixa.status !== "aberto") {
            return false;
        }
        
        try {
            this.caixa.status = "fechado";
            this.caixa.fechamento = new Date().toISOString();
            this.caixa.responsavelFechamento = responsavel;
            this.caixa.saldoFinal = saldoFinal;
            
            this.saveAppData();
            return true;
            
        } catch (error) {
            console.error("Erro ao fechar caixa:", error);
            return false;
        }
    }
    /**
     * Obtém pedidos do período do caixa aberto
     */
    getPedidosPeriodoCaixa() {
        if (!this.caixa.abertura) return [];
        
        const dataAbertura = new Date(this.caixa.abertura);
        return this.orders.filter(pedido => {
            const dataPedido = new Date(pedido.createdAt || pedido.paymentDate);
            return dataPedido >= dataAbertura && 
                   (pedido.paymentStatus === "paid" || pedido.paymentStatus === "closed");
        });
    }

    /**
     * Calcula resumo do caixa com base nos pedidos
     */
    calcularResumoCaixa(pedidos) {
        const resumo = {
            totalVendas: 0,
            porFormaPagamento: {},
            quantidadePedidos: pedidos.length
        };

        pedidos.forEach(pedido => {
            resumo.totalVendas += pedido.total || 0;
            
            const formaPagamento = pedido.paymentMethod || "desconhecido";
            if (!resumo.porFormaPagamento[formaPagamento]) {
                resumo.porFormaPagamento[formaPagamento] = {
                    total: 0,
                    quantidade: 0
                };
            }
            resumo.porFormaPagamento[formaPagamento].total += pedido.total || 0;
            resumo.porFormaPagamento[formaPagamento].quantidade++;
        });

        return resumo;
    }

    /**
     * Adiciona movimentação (entrada/saída) ao caixa
     */
    adicionarMovimentacao(tipo, valor, descricao, responsavel) {
        if (this.caixa.status !== "aberto") {
            return false;
        }

        const movimentacao = {
            id: Date.now(),
            tipo: tipo, // "entrada" ou "saída"
            valor: valor,
            descricao: descricao,
            responsavel: responsavel,
            data: new Date().toISOString()
        };

        this.caixa.movimentacoes.push(movimentacao);
        this.saveAppData();
        return movimentacao;
    }

    /**
     * Obtém status atual do caixa
     */
    getStatusCaixa() {
        return this.caixa.status;
    }

    /**
     * Obtém resumo completo do caixa
     */
    getResumoCaixa() {
        const caixaAberto = this.caixa.status === "aberto";
        
        if (!caixaAberto) {
            return {
                saldoInicial: 0,
                totalVendas: 0,
                totalEntradas: 0,
                totalSaidas: 0,
                saldoAtual: 0,
                quantidadePedidos: 0,
                porFormaPagamento: {}
            };
        }
    
        const pedidosCaixa = this.orders.filter(order => 
            order.paymentStatus === "paid" && 
            order.paymentDate && 
            new Date(order.paymentDate) >= new Date(this.caixa.abertura)
        );
    
        let totalVendas = 0;
        let quantidadePedidos = pedidosCaixa.length;
        
        // Agrupar por forma de pagamento
        const porFormaPagamento = {
            cash: { total: 0, quantidade: 0, nome: "Dinheiro" },
            card: { total: 0, quantidade: 0, nome: "Cartão" },
            pix: { total: 0, quantidade: 0, nome: "PIX" },
            meal_voucher: { total: 0, quantidade: 0, nome: "Vale Refeição" }
        };
    
        pedidosCaixa.forEach(order => {
            const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const taxa = subtotal * 0.1; // 10% taxa de serviço
            const total = subtotal + taxa;
            
            totalVendas += total;
            
            if (order.paymentMethod && porFormaPagamento[order.paymentMethod]) {
                porFormaPagamento[order.paymentMethod].total += total;
                porFormaPagamento[order.paymentMethod].quantidade += 1;
            } else {
                // Se não tiver método definido, considera como dinheiro
                porFormaPagamento.cash.total += total;
                porFormaPagamento.cash.quantidade += 1;
            }
        });
    
        // Calcular movimentações
        const movimentacoes = this.caixa.movimentacoes || [];
        const totalEntradas = movimentacoes
            .filter(m => m.tipo === "entrada")
            .reduce((sum, m) => sum + m.valor, 0);
        
        const totalSaidas = movimentacoes
            .filter(m => m.tipo === "saída")
            .reduce((sum, m) => sum + m.valor, 0);
    
        const saldoAtual = this.caixa.saldoInicial + totalVendas + totalEntradas - totalSaidas;
    
        return {
            saldoInicial: this.caixa.saldoInicial,
            totalVendas,
            totalEntradas,
            totalSaidas,
            saldoAtual,
            quantidadePedidos,
            porFormaPagamento
        };
    }

    /**
     * Obtém histórico de fechamentos de caixa
     */
    getHistoricoCaixa() {
        // Para implementação futura: armazenar múltiplos períodos de caixa
        return [this.caixa];
    }

    /**
     * Verifica se há pendências no caixa
     */
    verificarPendenciasCaixa() {
        if (this.caixa.status === "aberto") {
            const resumo = this.getResumoCaixa();
            const diferenca = Math.abs(this.caixa.saldoFinal - resumo.saldoAtual);
            
            return {
                temPendencia: this.caixa.saldoFinal > 0 && diferenca > 0.01,
                diferenca: diferenca
            };
        }
        return { temPendencia: false, diferenca: 0 };
    }
}

// Exporta instância singleton
export const dataManager = new DataManager();
export { LocalStorageHelper };