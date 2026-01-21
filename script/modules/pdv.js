// ===========================
// PDV - Ponto de Venda (VERSÃO COMPLETA COM CATEGORIAS PADRONIZADAS)
// ===========================

import { dataManager } from './dataManager.js';
import { NotificationSystem } from './notifications.js';
import { authManager } from './auth.js';
import { formatCurrency, calculateSubtotal, calculateServiceTax, renderProductImage } from '../utils/helpers.js';
import { validateOrder, validateInventory } from '../utils/validators.js';

/**
 * Gerenciador do PDV
 */
export class PDVManager {
    constructor() {
        this.currentOrder = {
            items: [],
            type: "table",
            tableNumber: 1,
            customerName: ""
        };
        this.initialized = false;
        this.productsCache = null;
        this.lastUpdateTime = 0;
        
        // MAPEAMENTO DE CATEGORIAS PADRONIZADAS
        this.categoryMapping = {
            // Mapeia variações para categorias padrão
            'pratos': 'Pratos',
            'Pratos': 'Pratos',
            'prato': 'Pratos',
            'Prato': 'Pratos',
            'lanches': 'Lanches',
            'Lanches': 'Lanches',
            'lanche': 'Lanches',
            'Lanche': 'Lanches',
            'comida': 'Pratos',
            'Comida': 'Pratos',
            'almoço': 'Pratos',
            'Almoço': 'Pratos',
            'jantar': 'Pratos',
            'Jantar': 'Pratos',
            'principal': 'Pratos',
            'Principal': 'Pratos',
            'refeição': 'Pratos',
            'Refeição': 'Pratos',
            
            'bebidas': 'Bebidas',
            'Bebidas': 'Bebidas',
            'bebida': 'Bebidas',
            'Bebida': 'Bebidas',
            'drinks': 'Bebidas',
            'Drinks': 'Bebidas',
            'drink': 'Bebidas',
            'Drink': 'Bebidas',
            'refrigerante': 'Bebidas',
            'Refrigerante': 'Bebidas',
            'suco': 'Bebidas',
            'Suco': 'Bebidas',
            'cerveja': 'Bebidas',
            'Cerveja': 'Bebidas',
            'água': 'Bebidas',
            'Água': 'Bebidas',
            'agua': 'Bebidas',
            'Agua': 'Bebidas',
            
            'sobremesas': 'Sobremesas',
            'Sobremesas': 'Sobremesas',
            'sobremesa': 'Sobremesas',
            'Sobremesa': 'Sobremesas',
            'doces': 'Sobremesas',
            'Doces': 'Sobremesas',
            'doce': 'Sobremesas',
            'Doce': 'Sobremesas',
            'sobremesas': 'Sobremesas',
            
            'promoções': 'Promoções',
            'Promoções': 'Promoções',
            'promocoes': 'Promoções',
            'Promocoes': 'Promoções',
            'promoção': 'Promoções',
            'Promoção': 'Promoções',
            'promocao': 'Promoções',
            'Promocao': 'Promoções',
            'promo': 'Promoções',
            'Promo': 'Promoções',
            'oferta': 'Promoções',
            'Oferta': 'Promoções',
            'especial': 'Promoções',
            'Especial': 'Promoções',
            'desconto': 'Promoções',
            'Desconto': 'Promoções',
        };
        
        // Lista de categorias padrão para os botões
        this.standardCategories = ['Todos', 'Lanches', 'Pratos', 'Bebidas', 'Sobremesas', 'Promoções'];
    }

    /**
     * Inicializa PDV
     */
    initialize() {
        if (this.initialized) return;
        this.initialized = true;

        this.setupCategoryButtons();
        this.setupOrderActions();
        this.setupInlineInputs();
        this.setupModalLogic();
        this.setupProductUpdatesListener();
        this.injectStyles(); // Adiciona estilos CSS
        this.loadProducts();
        this.setupDefaultCategories(); // Configura categorias padrão
    }

    /**
     * Configura os botões de categoria padrão
     */
    setupDefaultCategories() {
        const categoriesContainer = document.querySelector("#pdv .categories");
        if (!categoriesContainer) return;
        
        // Limpa botões existentes
        categoriesContainer.innerHTML = '';
        
        // Adiciona botões para cada categoria padrão
        this.standardCategories.forEach(category => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "category-btn";
            button.textContent = category;
            
            if (category === "Todos") {
                button.classList.add("active");
            }
            
            button.addEventListener("click", () => {
                // Remove active de todos os botões
                document.querySelectorAll("#pdv .category-btn").forEach(b => b.classList.remove("active"));
                button.classList.add("active");
                
                const categoryToFilter = category === "Todos" ? null : category;
                this.loadProducts(categoryToFilter);
            });
            
            categoriesContainer.appendChild(button);
        });
    }

    /**
     * Injeta estilos CSS para padronizar as imagens
     */
    injectStyles() {
        // Remove estilos anteriores se existirem
        const existingStyle = document.getElementById('pdv-custom-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'pdv-custom-styles';
        style.textContent = `
            /* Estilos para produtos no PDV - FIXO */
            #pdv .products-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 15px;
                padding: 15px;
                max-height: calc(100vh - 200px);
                overflow-y: auto;
                width: 100%;
            }

            #pdv .product-item {
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                padding: 15px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                background: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                width: 100%;
                height: 280px;
                overflow: hidden;
            }

            #pdv .product-item:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 16px rgba(0,0,0,0.1);
                border-color: #3498db;
            }

            /* Container da imagem - 140px x 140px FIXO */
            #pdv .product-image-container {
                width: 140px;
                height: 140px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 12px;
                overflow: hidden;
                border-radius: 8px;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                position: relative;
                flex-shrink: 0;
            }

            /* Imagem dentro do container - 140px x 140px */
            #pdv .product-image-container img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 6px;
            }

            /* Fallback para produtos sem imagem */
            #pdv .product-image-container .image-placeholder {
                font-size: 3rem;
                color: #95a5a6;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                background: #f8f9fa;
                border-radius: 6px;
            }

            /* Nome do produto */
            #pdv .product-name {
                font-weight: 600;
                margin: 10px 0 6px 0;
                font-size: 0.95rem;
                color: #2c3e50;
                line-height: 1.3;
                width: 100%;
                text-align: center;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                min-height: 40px;
                max-height: 40px;
            }

            /* Categoria do produto - PADRONIZADA */
            #pdv .product-category {
                font-size: 0.75rem;
                color: #7f8c8d;
                margin: 4px 0;
                font-style: italic;
                width: 100%;
                text-align: center;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                text-transform: lowercase;
                background: #f8f9fa;
                padding: 3px 8px;
                border-radius: 12px;
                display: inline-block;
                max-width: 80%;
            }

            /* Preço */
            #pdv .product-price {
                color: #27ae60;
                font-weight: bold;
                font-size: 1.1rem;
                margin-top: 8px;
                background: #f8fff8;
                padding: 6px 10px;
                border-radius: 6px;
                display: inline-block;
                margin-top: auto;
            }

            /* Cabeçalho de categoria */
            #pdv .category-header {
                grid-column: 1 / -1;
                font-size: 1.2rem;
                font-weight: bold;
                margin: 20px 0 10px 0;
                padding: 12px 15px;
                border-bottom: 2px solid #3498db;
                color: #2c3e50;
                background: linear-gradient(90deg, #3498db10, transparent);
                border-radius: 4px;
                width: 100%;
                box-sizing: border-box;
                text-transform: capitalize;
            }

            /* Divisor entre categorias */
            #pdv .category-divider {
                grid-column: 1 / -1;
                height: 1px;
                background: linear-gradient(90deg, transparent, #ecf0f1, transparent);
                margin: 20px 0;
                width: 100%;
            }

            /* Mensagem de nenhum produto */
            #pdv .no-orders {
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px;
                color: #7f8c8d;
                font-size: 1.1rem;
                background: #f8f9fa;
                border-radius: 12px;
                margin: 20px;
                width: calc(100% - 40px);
                box-sizing: border-box;
            }

            /* Responsividade */
            @media (max-width: 1024px) {
                #pdv .products-grid {
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 12px;
                    padding: 12px;
                }
                
                #pdv .product-item {
                    height: 260px;
                    padding: 12px;
                }
                
                #pdv .product-image-container {
                    width: 120px;
                    height: 120px;
                }
                
                #pdv .category-header {
                    font-size: 1.1rem;
                }
            }

            @media (max-width: 768px) {
                #pdv .products-grid {
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 10px;
                    padding: 10px;
                }
                
                #pdv .product-item {
                    height: 250px;
                    padding: 10px;
                }
                
                #pdv .product-image-container {
                    width: 110px;
                    height: 110px;
                }
                
                #pdv .product-name {
                    font-size: 0.9rem;
                    min-height: 36px;
                    max-height: 36px;
                }
            }

            @media (max-width: 480px) {
                #pdv .products-grid {
                    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
                    gap: 8px;
                    padding: 8px;
                }
                
                #pdv .product-item {
                    height: 240px;
                    padding: 8px;
                }
                
                #pdv .product-image-container {
                    width: 100px;
                    height: 100px;
                }
                
                #pdv .category-header {
                    font-size: 1rem;
                    margin: 15px 0 8px 0;
                    padding: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Configura listener para atualizações de produtos
     */
    setupProductUpdatesListener() {
        document.addEventListener('productListUpdated', (event) => {
            console.log('PDV: Produtos atualizados, recarregando...', event.detail);
            
            // Atualiza o cache
            this.refreshProductsCache();
            
            // Pega a categoria ativa atual
            const activeCategoryBtn = document.querySelector("#pdv .category-btn.active");
            let currentCategory = "Todos";
            
            if (activeCategoryBtn) {
                currentCategory = activeCategoryBtn.textContent.trim();
            }
            
            // Recarrega os produtos mantendo o filtro atual
            this.loadProducts(currentCategory === "Todos" ? null : currentCategory);
            
            // Notificação opcional
            if (event.detail.action === 'added') {
                NotificationSystem.info(`Produto "${event.detail.product.name}" disponível no PDV!`);
            }
        });
    }

    /**
     * Obtém produtos atualizados
     */
    getUpdatedProducts() {
        // Sempre retorna os produtos mais recentes do dataManager
        return [...dataManager.products].filter(product => product.active !== false);
    }

    /**
     * Força atualização do cache
     */
    refreshProductsCache() {
        this.productsCache = this.getUpdatedProducts();
        this.lastUpdateTime = Date.now();
    }

    /**
     * Configura botões de categoria
     */
    setupCategoryButtons() {
        const categoryButtons = document.querySelectorAll("#pdv .category-btn");
        
        categoryButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                categoryButtons.forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");

                const categoryText = btn.textContent.trim();
                const categoryToFilter = categoryText === "Todos" ? null : this.normalizeCategory(categoryText);
                
                this.loadProducts(categoryToFilter);
            });
        });
    }

    /**
     * Padroniza o nome da categoria
     */
    normalizeCategory(category) {
        if (!category) return 'Sem Categoria';
        
        const normalized = category.trim().toLowerCase();
        
        // Verifica se há mapeamento direto
        if (this.categoryMapping[normalized]) {
            return this.categoryMapping[normalized];
        }
        
        // Tenta encontrar correspondência parcial
        for (const [key, value] of Object.entries(this.categoryMapping)) {
            if (normalized.includes(key)) {
                return value;
            }
        }
        
        // Se não encontrar, retorna a categoria original capitalizada
        return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    }

    /**
     * Configura ações do pedido (Limpar, Finalizar e Novo Pedido)
     */
    setupOrderActions() {
        const clearBtn = document.getElementById("clear-order");
        const finalizeBtn = document.getElementById("finalize-order");
        const novoPedidoBtn = document.getElementById("pdv-novo-pedido");

        if (clearBtn) {
            clearBtn.addEventListener("click", () => this.clearOrder());
        }

        if (finalizeBtn) {
            finalizeBtn.addEventListener("click", () => this.finalizeOrder());
        }

        // Abre o modal de configuração ao clicar em "Novo Pedido"
        if (novoPedidoBtn) {
            novoPedidoBtn.addEventListener("click", () => {
                document.dispatchEvent(new Event('openOrderModal'));
            });
        }
    }

    /**
     * Sincroniza os inputs da barra lateral com o objeto currentOrder
     */
    setupInlineInputs() {
        const typeSelect = document.getElementById("pdv-type-selector");
        const tableInput = document.getElementById("pdv-table-input");
        const customerInput = document.getElementById("pdv-customer-input");

        if (typeSelect) {
            typeSelect.addEventListener("change", (e) => {
                this.currentOrder.type = e.target.value;
                if (tableInput) {
                    tableInput.style.display = e.target.value === "table" ? "inline-block" : "none";
                }
            });
        }

        if (tableInput) {
            tableInput.addEventListener("input", (e) => {
                this.currentOrder.tableNumber = parseInt(e.target.value) || 0;
            });
        }

        if (customerInput) {
            customerInput.addEventListener("input", (e) => {
                this.currentOrder.customerName = e.target.value;
            });
        }
    }

    /**
     * Captura os dados quando o usuário confirma no modal (Novo Pedido)
     */
    setupModalLogic() {
        const confirmBtn = document.getElementById("confirm-order");
        
        if (confirmBtn) {
            confirmBtn.addEventListener("click", () => {
                const type = document.getElementById("order-type").value;
                const tableNumber = parseInt(document.getElementById("table-number").value);
                const customerName = document.getElementById("customer-name").value;

                // Atualiza o objeto do pedido
                this.setOrderData({
                    type: type,
                    tableNumber: type === "table" ? tableNumber : null,
                    customerName: customerName
                });

                // Sincroniza os inputs da lateral para refletir o que foi posto no modal
                if(document.getElementById("pdv-type-selector")) document.getElementById("pdv-type-selector").value = type;
                if(document.getElementById("pdv-table-input")) document.getElementById("pdv-table-input").value = tableNumber;
                if(document.getElementById("pdv-customer-input")) document.getElementById("pdv-customer-input").value = customerName;

                NotificationSystem.success(type === "table" ? `Mesa ${tableNumber} pronta` : "Balcão pronto");
            });
        }
    }

    /**
     * Carrega produtos no grid com categorias padronizadas
     */
    loadProducts(category = null) {
        const productsGrid = document.querySelector("#pdv .products-grid");
        if (!productsGrid) return;

        productsGrid.innerHTML = "";

        const allProducts = this.getUpdatedProducts();
        let filteredProducts = [];
        
        if (!category || category === "Todos") {
            // Mostra todos os produtos
            filteredProducts = allProducts;
        } else {
            // Filtro com categorias padronizadas
            filteredProducts = allProducts.filter((p) => {
                if (!p.category) return false;
                
                // Normaliza a categoria do produto
                const productCategory = this.normalizeCategory(p.category);
                
                // Compara com a categoria normalizada do filtro
                return productCategory === category;
            });
        }

        if (filteredProducts.length === 0) {
            // Obtém categorias únicas normalizadas
            const uniqueCategories = [...new Set(allProducts.map(p => this.normalizeCategory(p.category)))];
            
            productsGrid.innerHTML = `
                <div class="no-orders">
                    Nenhum produto encontrado em "${category}"
                    <br><small>Categorias disponíveis: ${uniqueCategories.join(', ')}</small>
                </div>
            `;
            return;
        }

        // Se estiver filtrando por uma categoria específica, mostra os produtos diretamente
        if (category && category !== "Todos") {
            this.renderProductsList(productsGrid, filteredProducts);
        } else {
            // Se for "Todos", agrupa por categoria padronizada
            this.loadProductsGroupedByCategory(productsGrid, filteredProducts);
        }
    }

    /**
     * Carrega produtos agrupados por categoria padronizada
     */
    loadProductsGroupedByCategory(container, products) {
        // Agrupa produtos por categoria padronizada
        const productsByCategory = {};
        
        products.forEach(product => {
            const category = this.normalizeCategory(product.category) || 'Sem Categoria';
            if (!productsByCategory[category]) {
                productsByCategory[category] = [];
            }
            productsByCategory[category].push(product);
        });

        // Ordena categorias alfabeticamente
        const sortedCategories = Object.keys(productsByCategory).sort();

        if (sortedCategories.length === 0) {
            container.innerHTML = `
                <div class="no-orders">
                    Nenhum produto cadastrado
                </div>
            `;
            return;
        }

        // Cria seções para cada categoria
        sortedCategories.forEach((category, categoryIndex) => {
            // Adiciona cabeçalho da categoria
            const categoryHeader = document.createElement("div");
            categoryHeader.className = "category-header";
            categoryHeader.textContent = category;
            container.appendChild(categoryHeader);

            // Adiciona produtos da categoria
            this.renderProductsList(container, productsByCategory[category]);

            // Adiciona um divisor entre categorias (exceto na última)
            if (categoryIndex < sortedCategories.length - 1) {
                const divider = document.createElement("div");
                divider.className = "category-divider";
                container.appendChild(divider);
            }
        });
    }

    /**
     * Renderiza lista de produtos com categorias padronizadas
     */
    renderProductsList(container, products) {
        products.forEach((product) => {
            const productElement = document.createElement("div");
            productElement.className = "product-item";
            
            const normalizedCategory = this.normalizeCategory(product.category);
            
            productElement.innerHTML = `
                <div class="product-image-container">
                    ${renderProductImage(product.image, product.name)}
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-category">${normalizedCategory}</div>
                <div class="product-price">${formatCurrency(product.price)}</div>
            `;

            productElement.addEventListener("click", () => {
                this.addToOrder(product);
            });

            container.appendChild(productElement);
        });
    }

    /**
     * Adiciona produto ao pedido com validação de estoque
     */
    addToOrder(product) {
        if (!product) return;

        const existingItem = this.currentOrder.items.find(
            item => item.productId === product.id
        );
        const requestedQty = (existingItem?.quantity || 0) + 1;

        const inventoryErrors = validateInventory(
            product.id, 
            requestedQty, 
            dataManager.inventory
        );

        if (inventoryErrors.length > 0) {
            NotificationSystem.error(inventoryErrors[0]);
            return;
        }

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.currentOrder.items.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
            });
        }

        this.updateOrderSummary();
    }

    /**
     * Atualiza resumo do pedido na interface
     */
    updateOrderSummary() {
        const orderItems = document.getElementById("current-order-items");
        const subtotalElement = document.getElementById("subtotal");
        const serviceTaxElement = document.getElementById("service-tax");
        const totalElement = document.getElementById("total");

        if (!orderItems) return;

        orderItems.innerHTML = "";

        if (this.currentOrder.items.length === 0) {
            orderItems.innerHTML = '<div class="no-orders">Nenhum item no pedido</div>';
            if (subtotalElement) subtotalElement.textContent = formatCurrency(0);
            if (serviceTaxElement) serviceTaxElement.textContent = formatCurrency(0);
            if (totalElement) totalElement.textContent = formatCurrency(0);
            return;
        }

        const subtotal = calculateSubtotal(this.currentOrder.items);
        const serviceTax = calculateServiceTax(subtotal);
        const total = subtotal + serviceTax;

        this.currentOrder.items.forEach((item) => {
            const itemTotal = item.price * item.quantity;

            const itemElement = document.createElement("div");
            itemElement.className = "order-item";
            itemElement.innerHTML = `
                <div class="order-item-info">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-price">${formatCurrency(item.price)}</div>
                </div>
                <div class="order-item-controls">
                    <button class="quantity-btn minus" data-id="${item.productId}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${item.productId}">+</button>
                </div>
                <div class="order-item-total">${formatCurrency(itemTotal)}</div>
            `;

            orderItems.appendChild(itemElement);
        });

        // Eventos dos botões de quantidade (+ e -)
        orderItems.querySelectorAll(".quantity-btn.minus").forEach((btn) => {
            btn.addEventListener("click", () => this.decreaseQuantity(parseInt(btn.getAttribute("data-id"))));
        });

        orderItems.querySelectorAll(".quantity-btn.plus").forEach((btn) => {
            btn.addEventListener("click", () => this.increaseQuantity(parseInt(btn.getAttribute("data-id"))));
        });

        if (subtotalElement) subtotalElement.textContent = formatCurrency(subtotal);
        if (serviceTaxElement) serviceTaxElement.textContent = formatCurrency(serviceTax);
        if (totalElement) totalElement.textContent = formatCurrency(total);
    }

    /**
     * Aumenta a quantidade de um item no pedido
     */
    increaseQuantity(productId) {
        const item = this.currentOrder.items.find(i => i.productId === productId);
        if (item) {
            const invErrors = validateInventory(productId, item.quantity + 1, dataManager.inventory);
            if (invErrors.length > 0) return NotificationSystem.error(invErrors[0]);
            item.quantity += 1;
            this.updateOrderSummary();
        }
    }

    /**
     * Diminui a quantidade de um item no pedido
     */
    decreaseQuantity(productId) {
        const itemIndex = this.currentOrder.items.findIndex(i => i.productId === productId);
        if (itemIndex !== -1) {
            if (this.currentOrder.items[itemIndex].quantity > 1) {
                this.currentOrder.items[itemIndex].quantity -= 1;
            } else {
                this.currentOrder.items.splice(itemIndex, 1);
            }
            this.updateOrderSummary();
        }
    }

    /**
     * Limpa o pedido atual
     */
    clearOrder() {
        if (this.currentOrder.items.length === 0) return;
        NotificationSystem.confirm("Deseja limpar o pedido?", "Limpar", "Cancelar").then((conf) => {
            if (conf) {
                this.currentOrder.items = [];
                this.updateOrderSummary();
            }
        });
    }

    /**
     * Finaliza o pedido e salva no sistema
     */
    finalizeOrder() {
        if (this.currentOrder.items.length === 0) {
            NotificationSystem.warning("Adicione itens ao pedido!");
            return;
        }

        // Validação de permissão para mesas
        if (this.currentOrder.type === "table" && !authManager.hasPermission("mesas")) {
            NotificationSystem.error("Sem permissão para gerir mesas!");
            return;
        }

        const subtotal = calculateSubtotal(this.currentOrder.items);
        const serviceTax = calculateServiceTax(subtotal);
        const total = subtotal + serviceTax;

        const newOrder = {
            id: Date.now(),
            type: this.currentOrder.type,
            tableNumber: this.currentOrder.tableNumber,
            customerName: this.currentOrder.customerName,
            items: [...this.currentOrder.items],
            status: "pending",
            createdAt: new Date(),
            subtotal,
            serviceTax,
            total,
            waiter: authManager.getCurrentUser()?.name || "Balcão",
            paymentStatus: "pending"
        };

        // Valida o pedido antes de finalizar
        const validationErrors = validateOrder(newOrder);
        if (validationErrors.length > 0) {
            NotificationSystem.error(validationErrors.join(', '));
            return;
        }

        // Salva e atualiza sistema
        dataManager.orders.push(newOrder);

        // Atualiza estoque
        this.currentOrder.items.forEach(item => {
            const inv = dataManager.inventory.find(i => i.productId === item.productId);
            if (inv) inv.currentStock -= item.quantity;
        });

        // Se for mesa, marca como ocupada
        if (this.currentOrder.type === "table") {
            const mesa = dataManager.mesas.find(m => m.numero === this.currentOrder.tableNumber);
            if (mesa) {
                mesa.status = "ocupada";
                mesa.pedidoId = newOrder.id;
            }
        }

        this.currentOrder.items = [];
        this.updateOrderSummary();
        dataManager.saveAppData();

        document.dispatchEvent(new CustomEvent('orderCreated', { detail: { order: newOrder } }));
        NotificationSystem.success(`Pedido #${newOrder.id} finalizado!`);
    }

    /**
     * Define dados do pedido atual
     */
    setOrderData(data) {
        this.currentOrder = { ...this.currentOrder, ...data };
    }

    /**
     * Obtém o pedido atual
     */
    getCurrentOrder() {
        return { ...this.currentOrder };
    }

    /**
     * Remove um item específico do pedido
     */
    removeItemFromOrder(productId) {
        const itemIndex = this.currentOrder.items.findIndex(i => i.productId === productId);
        if (itemIndex !== -1) {
            this.currentOrder.items.splice(itemIndex, 1);
            this.updateOrderSummary();
        }
    }

    /**
     * Atualiza a quantidade de um item específico
     */
    updateItemQuantity(productId, newQuantity) {
        if (newQuantity <= 0) {
            this.removeItemFromOrder(productId);
            return;
        }

        const item = this.currentOrder.items.find(i => i.productId === productId);
        if (item) {
            const invErrors = validateInventory(productId, newQuantity, dataManager.inventory);
            if (invErrors.length > 0) return NotificationSystem.error(invErrors[0]);
            item.quantity = newQuantity;
            this.updateOrderSummary();
        }
    }

    /**
     * Verifica se há produtos suficientes no estoque
     */
    checkInventoryForOrder() {
        const inventoryIssues = [];
        
        this.currentOrder.items.forEach(item => {
            const inv = dataManager.inventory.find(i => i.productId === item.productId);
            if (inv && inv.currentStock < item.quantity) {
                inventoryIssues.push(`${item.name}: estoque insuficiente (${inv.currentStock} disponíveis)`);
            }
        });

        return inventoryIssues;
    }

    /**
     * Recalcula totais do pedido
     */
    recalculateTotals() {
        const subtotal = calculateSubtotal(this.currentOrder.items);
        const serviceTax = calculateServiceTax(subtotal);
        const total = subtotal + serviceTax;
        
        return {
            subtotal,
            serviceTax,
            total
        };
    }

    /**
     * Reinicia o PDV para um novo pedido
     */
    resetForNewOrder() {
        this.currentOrder = {
            items: [],
            type: "table",
            tableNumber: 1,
            customerName: ""
        };
        
        // Reseta os controles da interface
        if (document.getElementById("pdv-type-selector")) {
            document.getElementById("pdv-type-selector").value = "table";
        }
        
        if (document.getElementById("pdv-table-input")) {
            document.getElementById("pdv-table-input").value = "1";
        }
        
        if (document.getElementById("pdv-customer-input")) {
            document.getElementById("pdv-customer-input").value = "";
        }
        
        this.updateOrderSummary();
        NotificationSystem.info("PDV pronto para novo pedido");
    }

    /**
     * Atualiza a visualização quando a aba PDV é aberta
     */
    refreshOnTabOpen() {
        if (!this.initialized) return;
        
        // Recarrega produtos para garantir que está atualizado
        this.refreshProductsCache();
        
        // Pega a categoria ativa atual
        const activeCategoryBtn = document.querySelector("#pdv .category-btn.active");
        let currentCategory = "Todos";
        
        if (activeCategoryBtn) {
            currentCategory = activeCategoryBtn.textContent.trim();
        }
        
        // Recarrega os produtos
        this.loadProducts(currentCategory === "Todos" ? null : currentCategory);
        
        // Atualiza o resumo do pedido
        this.updateOrderSummary();
    }
    loadExistingOrder(order) {
        if (!order || !order.items) return;
        
        // Limpa o pedido atual
        this.currentOrder.items = [];
        
        // Configura dados básicos
        this.currentOrder.type = order.type || "table";
        this.currentOrder.tableNumber = order.tableNumber || 0;
        this.currentOrder.customerName = order.customerName || "";
        
        // Adiciona os itens
        order.items.forEach(item => {
            const product = dataManager.products.find(p => p.id === item.productId);
            if (product) {
                for (let i = 0; i < item.quantity; i++) {
                    this.addToOrder(product);
                }
            }
        });
        
        this.updateOrderSummary();
        console.log(`Pedido #${order.id} carregado no PDV`);
    }
}

// Instância global do PDV
export const pdvManager = new PDVManager();