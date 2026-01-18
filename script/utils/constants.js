// script/utils/constants.js

export const USERS = [
    {username: "garcom", password: "123", profile: "garcom", name: "João Silva", permissions: ["pdv", "pedidos", "mesas", "cozinha"]},
    {username: "caixa", password: "123", profile: "caixa", name: "Maria Santos", permissions: ["pdv", "pedidos", "mesas", "relatorios"]},
    {username: "cozinha", password: "123", profile: "cozinha", name: "Pedro Cozinha", permissions: ["cozinha"]},
    {username: "gestor", password: "123", profile: "gestor", name: "Carlos Oliveira", permissions: ["dashboard", "pdv", "pedidos", "cozinha", "mesas", "relatorios", "produtos"]},
];

export const PAYMENT_METHODS = [
    {id: "cash", name: "Dinheiro", requiresChange: true},
    {id: "card", name: "Cartão", requiresChange: false},
    {id: "pix", name: "PIX", requiresChange: false},
    {id: "meal_voucher", name: "Vale Refeição", requiresChange: false},
];

// Variáveis globais que serão compartilhadas
export let currentUser = null;
export let products = [
    {id: 1, name: "Pizza Margherita", price: 29.95, category: "Pratos", image: "🍕"},
    {id: 2, name: "Pizza Calabresa", price: 32.5, category: "Pratos", image: "🍕"},
    {id: 3, name: "Hamburguer Artesanal", price: 19.5, category: "Pratos", image: "🍔"},
    {id: 4, name: "Batata Frita", price: 12.0, category: "Pratos", image: "🍟"},
    {id: 5, name: "Refrigerante", price: 5.0, category: "Bebidas", image: "🥤"},
    {id: 6, name: "Suco Natural", price: 8.0, category: "Bebidas", image: "🧃"},
    {id: 7, name: "Cerveja", price: 7.5, category: "Bebidas", image: "🍺"},
    {id: 8, name: "Sorvete", price: 9.9, category: "Sobremesas", image: "🍦"},
    {id: 9, name: "Brownie", price: 12.5, category: "Sobremesas", image: "🍫"},
    {id: 10, name: "Combo Casal", price: 49.9, category: "Promoções", image: "💑"},
];

export let currentOrder = {items: [], type: "table", tableNumber: 1, customerName: ""};
export let orders = [];
export let mesas = Array.from({length: 15}, (_, i) => ({numero: i + 1, status: "livre", pedidoId: null}));
export let inventory = [];
export let comandas = [];