// ===========================
// CONSTANTS.JS - Constantes e Configurações
// ===========================

export const USERS = [
    {username: "garcom", password: "123", profile: "garcom", name: "João Silva", permissions: ["pdv", "pedidos", "mesas", "cozinha"]},
    {username: "caixa", password: "123", profile: "caixa", name: "Maria Santos", permissions: ["pdv", "pedidos", "mesas", "relatorios", "caixa", "delivery"]}, // Adicionado "delivery"
    {username: "cozinha", password: "123", profile: "cozinha", name: "Pedro Cozinha", permissions: ["cozinha"]},
    {username: "gestor", password: "123", profile: "gestor", name: "Carlos Oliveira", permissions: ["dashboard", "pdv", "pedidos", "cozinha", "mesas", "relatorios", "produtos", "funcionarios", "caixa", "delivery"]}, // Adicionado "delivery"
];
export const ROLE_PERMISSIONS = {
    garcom: ["pdv", "pedidos", "mesas", "cozinha"],
    caixa: ["pdv", "pedidos", "mesas", "relatorios", "caixa", "delivery"],
    cozinha: ["cozinha"],
    gestor: ["dashboard", "pdv", "pedidos", "cozinha", "mesas", "relatorios", "produtos", "funcionarios", "caixa", "delivery"],
    gerente: ["dashboard", "pdv", "pedidos", "cozinha", "mesas", "relatorios", "produtos", "funcionarios", "caixa", "delivery"]
};

export const INITIAL_PRODUCTS = [
    {id: 1, name: "Pizza Margherita", price: 35.99, category: "Pratos", image: "../images/pizza-margherita.jpg"},
    {id: 2, name: "Pizza Calabresa", price: 36.99, category: "Pratos", image: "../images/pizza-calabresa.jpg"},
    {id: 3, name: "Pizza Mussarela", price: 31.99, category: "Pratos", image: "../images/pizza-mussarela.jpg"},
    {id: 4, name: "Pizza Frango com Requeijão", price: 34.99, category: "Pratos", image: "../images/pizza-frango-com-requeijao.jpg"},
    {id: 5, name: "Refrigerante 2 Litros", price: 12.0, category: "Bebidas", image: "../images/refrigerante.jpg"},
    {id: 6, name: "Jarra de Suco Natural", price: 15.0, category: "Bebidas", image: "../images/jarra-de-suco.jpg"},
    {id: 7, name: "Cerveja", price: 15.00, category: "Bebidas", image: "../images/cerveja-600.jpg"},
    {id: 8, name: "Sorvete", price: 9.9, category: "Sobremesas", image: "../images/sorvete.jpg"},
    {id: 9, name: "Brownie", price: 9.99 , category: "Sobremesas", image: "../images/brownie.jpg"},
    {id: 10, name: "Combo Casal", price: 49.9, category: "Promoções", image: "../images/combo.jpg"},
];

export const PAYMENT_METHODS = [
    {id: "cash", name: "Dinheiro", requiresChange: true},
    {id: "card", name: "Cartão", requiresChange: false},
    {id: "pix", name: "PIX", requiresChange: false},
    {id: "meal_voucher", name: "Vale Refeição", requiresChange: false},
];

export const CAIXA_STATUS = {
    FECHADO: "fechado",
    ABERTO: "aberto",
    FECHAMENTO_PENDENTE: "fechamento_pendente"
};

// Adicione aos status de pedido
export const ORDER_STATUS = {
    PENDING: "pending",
    PREPARING: "preparing",
    READY: "ready",
    DELIVERED: "delivered",
    PAID: "paid",
    ENROUTE: "enroute"  
};

// Atualize os labels de status
export const STATUS_LABELS = {
    [ORDER_STATUS.PENDING]: "Pendente",
    [ORDER_STATUS.PREPARING]: "Preparando",
    [ORDER_STATUS.READY]: "Pronto",
    [ORDER_STATUS.DELIVERED]: "Entregue",
    [ORDER_STATUS.PAID]: "Pago",
    [ORDER_STATUS.ENROUTE]: "Em Rota"
};

export const PAYMENT_STATUS = {
    PENDING: "pending",
    PAID: "paid",
    CLOSED: "closed"
};

export const TABLE_STATUS = {
    LIVRE: "livre",
    OCUPADA: "ocupada",
    LIMPANDO: "limpando"
};

export const ORDER_TYPES = {
    TABLE: "table",
    COUNTER: "counter",
    DELIVERY: "delivery"
};

export const CONFIG = {
    TOTAL_TABLES: 15,
    SERVICE_TAX_RATE: 0.1,
    INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutos
    AUTO_SAVE_INTERVAL: 30000, // 30 segundos
    CLEANING_TIMEOUT: 30000, // 30 segundos
    APP_VERSION: "1.0"
};

export const STORAGE_KEYS = {
    APP_DATA: "pdvAppData",
    CURRENT_USER: "currentUser"
};

export const PAYMENT_STATUS_LABELS = {
    [PAYMENT_STATUS.PENDING]: "Pendente",
    [PAYMENT_STATUS.PAID]: "Pago",
    [PAYMENT_STATUS.CLOSED]: "Mesa Finalizada"
};

export const ORDER_TYPE_LABELS = {
    [ORDER_TYPES.TABLE]: "Mesa",
    [ORDER_TYPES.COUNTER]: "Balcão",
    [ORDER_TYPES.DELIVERY]: "Delivery"
};

export const PROFILE_LABELS = {
    garcom: "Garçom",
    caixa: "Caixa",
    cozinha: "Cozinha",
    gestor: "Gestor"
};

export const TAB_LABELS = {
    dashboard: "Dashboard",
    pdv: "PDV",
    pedidos: "Balcão",
    cozinha: "Cozinha",
    mesas: "Mesas",
    relatorios: "Relatórios",
    produtos: "Produtos",
    funcionarios: "Funcionários", 
    caixa: "Caixa",
    delivery: "Delivery"
};