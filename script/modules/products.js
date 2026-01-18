// script/modules/products.js

import { 
    products, 
    inventory, 
    currentUser 
} from '../utils/constants.js';
import { NotificationSystem } from './notifications.js';
import { DataManager } from './dataManager.js';
import { DataValidator } from '../utils/validators.js';
import { formatCurrency } from '../utils/helpers.js';

export function initializeProdutos() {
    if (!currentUser || !currentUser.permissions.includes("produtos")) {
        const produtosTab = document.querySelector('.nav-item[data-tab="produtos"]');
        if (produtosTab) produtosTab.style.display = "none";
        return;
    }

    const addProductBtn = document.getElementById("add-product");
    if (addProductBtn) {
        addProductBtn.addEventListener("click", showAddProductModal);
    }

    // Configurar busca de produtos
    const searchInput = document.querySelector("#produtos-container input[type='text']");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            filterProducts(e.target.value);
        });
    }

    // Configurar filtro de categorias
    const categoryFilter = document.querySelector("#produtos-container select");
    if (categoryFilter) {
        categoryFilter.addEventListener("change", (e) => {
            filterByCategory(e.target.value);
        });
    }

    updateProdutosView();
}

export function updateProdutosView() {
    const productsList = document.getElementById("products-list-container");
    if (!productsList) return;

    productsList.innerHTML = "";

    if (products.length === 0) {
        productsList.innerHTML = `
            <div class="no-orders">
                <p>Nenhum produto cadastrado</p>
                <button class="btn btn-primary mt-10" id="add-first-product">
                    Adicionar Primeiro Produto
                </button>
            </div>
        `;
        
        document.getElementById("add-first-product")?.addEventListener("click", showAddProductModal);
        return;
    }

    // Agrupar produtos por categoria
    const productsByCategory = groupProductsByCategory(products);

    Object.entries(productsByCategory).forEach(([category, categoryProducts]) => {
        const categorySection = document.createElement("div");
        categorySection.className = "category-section";
        categorySection.innerHTML = `
            <h4 class="category-title">${category}</h4>
            <div class="category-products">
                ${categoryProducts.map(product => createProductCard(product)).join('')}
            </div>
        `;
        
        productsList.appendChild(categorySection);
    });

    // Adicionar contador de produtos
    const productCount = document.createElement("div");
    productCount.className = "product-count";
    productCount.innerHTML = `
        <p><strong>Total:</strong> ${products.length} produtos cadastrados</p>
    `;
    productsList.appendChild(productCount);
}

function groupProductsByCategory(productsArray) {
    return productsArray.reduce((acc, product) => {
        const category = product.category || "Sem Categoria";
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(product);
        return acc;
    }, {});
}

function createProductCard(product) {
    const inventoryItem = inventory.find(i => i.productId === product.id);
    const stockStatus = getStockStatus(inventoryItem);
    
    return `
        <div class="product-card" data-id="${product.id}">
            <div class="product-card-header">
                <div class="product-image">${product.image || "📦"}</div>
                <div class="product-actions">
                    <button class="btn-icon edit-product" data-id="${product.id}" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-icon delete-product" data-id="${product.id}" title="Excluir">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="product-card-body">
                <h5 class="product-name">${product.name}</h5>
                <p class="product-category">${product.category}</p>
                <div class="product-price">${formatCurrency(product.price)}</div>
                
                ${inventoryItem ? `
                    <div class="product-inventory ${stockStatus.class}">
                        <span class="inventory-label">Estoque:</span>
                        <span class="inventory-value">
                            ${inventoryItem.currentStock} unidades
                            ${inventoryItem.minStock ? `(mín: ${inventoryItem.minStock})` : ''}
                        </span>
                    </div>
                ` : `
                    <div class="product-inventory no-inventory">
                        <span>Controle de estoque não configurado</span>
                    </div>
                `}
                
                ${product.description ? `
                    <p class="product-description">${product.description}</p>
                ` : ''}
            </div>
            <div class="product-card-footer">
                <button class="btn btn-sm btn-outline edit-inventory" data-id="${product.id}">
                    ${inventoryItem ? 'Gerenciar Estoque' : 'Configurar Estoque'}
                </button>
            </div>
        </div>
    `;
}

function getStockStatus(inventoryItem) {
    if (!inventoryItem) return { class: 'no-stock', text: 'Sem estoque' };
    
    if (inventoryItem.currentStock === 0) {
        return { class: 'out-of-stock', text: 'Esgotado' };
    }
    
    if (inventoryItem.currentStock <= inventoryItem.minStock) {
        return { class: 'low-stock', text: 'Estoque Baixo' };
    }
    
    return { class: 'in-stock', text: 'Em Estoque' };
}

export function showAddProductModal() {
    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.id = "add-product-modal";
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>➕ Adicionar Novo Produto</h3>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="product-form">
                    <div class="form-group">
                        <label for="product-name">Nome do Produto *</label>
                        <input type="text" id="product-name" required 
                               placeholder="Ex: Pizza Margherita">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-price">Preço (R$) *</label>
                            <input type="number" id="product-price" step="0.01" min="0" required 
                                   placeholder="29.90">
                        </div>
                        
                        <div class="form-group">
                            <label for="product-category">Categoria *</label>
                            <select id="product-category" required>
                                <option value="">Selecione...</option>
                                <option value="Pratos">Pratos</option>
                                <option value="Bebidas">Bebidas</option>
                                <option value="Sobremesas">Sobremesas</option>
                                <option value="Promoções">Promoções</option>
                                <option value="Acompanhamentos">Acompanhamentos</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="product-image">Ícone/Emoji</label>
                        <input type="text" id="product-image" 
                               placeholder="🍕, 🍔, 🥤, etc.">
                        <small>Use emojis ou texto para representar o produto</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="product-description">Descrição (opcional)</label>
                        <textarea id="product-description" rows="3" 
                                  placeholder="Descrição detalhada do produto..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="setup-inventory">
                            Configurar controle de estoque
                        </label>
                    </div>
                    
                    <div id="inventory-fields" style="display: none;">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="initial-stock">Estoque Inicial</label>
                                <input type="number" id="initial-stock" min="0" value="0">
                            </div>
                            
                            <div class="form-group">
                                <label for="min-stock">Estoque Mínimo</label>
                                <input type="number" id="min-stock" min="0" value="5">
                                <small>Alerta quando atingir este nível</small>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="cancel-product">
                    Cancelar
                </button>
                <button type="button" class="btn btn-primary" id="save-product">
                    Salvar Produto
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar eventos
    const closeBtn = modal.querySelector(".close");
    const cancelBtn = modal.querySelector("#cancel-product");
    const saveBtn = modal.querySelector("#save-product");
    const setupInventory = modal.querySelector("#setup-inventory");
    const inventoryFields = modal.querySelector("#inventory-fields");
    
    setupInventory.addEventListener("change", function() {
        inventoryFields.style.display = this.checked ? "block" : "none";
    });
    
    function closeModal() {
        modal.classList.remove("active");
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
    
    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);
    
    saveBtn.addEventListener("click", saveProduct);
    
    // Fechar ao clicar fora
    modal.addEventListener("click", function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Fechar com ESC
    document.addEventListener("keydown", function escHandler(e) {
        if (e.key === "Escape" && modal.classList.contains("active")) {
            closeModal();
            document.removeEventListener("keydown", escHandler);
        }
    });
}

function saveProduct() {
    const name = document.getElementById("product-name").value.trim();
    const price = parseFloat(document.getElementById("product-price").value);
    const category = document.getElementById("product-category").value;
    const image = document.getElementById("product-image").value.trim() || "📦";
    const description = document.getElementById("product-description").value.trim();
    const setupInventory = document.getElementById("setup-inventory").checked;
    const initialStock = parseInt(document.getElementById("initial-stock")?.value || "0");
    const minStock = parseInt(document.getElementById("min-stock")?.value || "5");
    
    // Validar dados
    const product = { name, price, category, image, description };
    const errors = DataValidator.validateProduct(product);
    
    if (errors.length > 0) {
        NotificationSystem.show(errors[0], "error");
        return;
    }
    
    // Gerar ID
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    
    // Adicionar produto
    const newProduct = {
        id: newId,
        ...product
    };
    
    products.push(newProduct);
    
    // Configurar estoque se solicitado
    if (setupInventory) {
        inventory.push({
            productId: newId,
            productName: name,
            currentStock: initialStock,
            minStock: minStock,
            alert: initialStock <= minStock,
            lastUpdated: new Date().toISOString()
        });
    }
    
    // Salvar dados
    DataManager.saveAppData();
    
    // Atualizar view
    updateProdutosView();
    
    // Fechar modal
    const modal = document.getElementById("add-product-modal");
    if (modal) {
        modal.classList.remove("active");
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
    
    NotificationSystem.show(`Produto "${name}" adicionado com sucesso!`, "success");
}

export function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        NotificationSystem.show("Produto não encontrado", "error");
        return;
    }
    
    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.id = "edit-product-modal";
    
    const inventoryItem = inventory.find(i => i.productId === productId);
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>✏️ Editar Produto</h3>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <form id="edit-product-form">
                    <div class="form-group">
                        <label for="edit-product-name">Nome do Produto</label>
                        <input type="text" id="edit-product-name" value="${product.name}" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-product-price">Preço (R$)</label>
                            <input type="number" id="edit-product-price" step="0.01" min="0" 
                                   value="${product.price}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-product-category">Categoria</label>
                            <select id="edit-product-category" required>
                                <option value="">Selecione...</option>
                                <option value="Pratos" ${product.category === 'Pratos' ? 'selected' : ''}>Pratos</option>
                                <option value="Bebidas" ${product.category === 'Bebidas' ? 'selected' : ''}>Bebidas</option>
                                <option value="Sobremesas" ${product.category === 'Sobremesas' ? 'selected' : ''}>Sobremesas</option>
                                <option value="Promoções" ${product.category === 'Promoções' ? 'selected' : ''}>Promoções</option>
                                <option value="Acompanhamentos" ${product.category === 'Acompanhamentos' ? 'selected' : ''}>Acompanhamentos</option>
                                <option value="Outros" ${product.category === 'Outros' ? 'selected' : ''}>Outros</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-product-image">Ícone/Emoji</label>
                        <input type="text" id="edit-product-image" value="${product.image || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-product-description">Descrição</label>
                        <textarea id="edit-product-description" rows="3">${product.description || ''}</textarea>
                    </div>
                    
                    ${inventoryItem ? `
                        <div class="inventory-info">
                            <h4>📦 Controle de Estoque</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-current-stock">Estoque Atual</label>
                                    <input type="number" id="edit-current-stock" 
                                           value="${inventoryItem.currentStock}" min="0">
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-min-stock">Estoque Mínimo</label>
                                    <input type="number" id="edit-min-stock" 
                                           value="${inventoryItem.minStock || 5}" min="0">
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="add-inventory">
                                Adicionar controle de estoque
                            </label>
                        </div>
                        
                        <div id="add-inventory-fields" style="display: none;">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="add-initial-stock">Estoque Inicial</label>
                                    <input type="number" id="add-initial-stock" min="0" value="0">
                                </div>
                                
                                <div class="form-group">
                                    <label for="add-min-stock">Estoque Mínimo</label>
                                    <input type="number" id="add-min-stock" min="0" value="5">
                                </div>
                            </div>
                        </div>
                    `}
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="cancel-edit">
                    Cancelar
                </button>
                <button type="button" class="btn btn-primary" id="update-product">
                    Atualizar Produto
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar eventos
    const closeBtn = modal.querySelector(".close");
    const cancelBtn = modal.querySelector("#cancel-edit");
    const updateBtn = modal.querySelector("#update-product");
    const addInventory = modal.querySelector("#add-inventory");
    const addInventoryFields = modal.querySelector("#add-inventory-fields");
    
    if (addInventory) {
        addInventory.addEventListener("change", function() {
            addInventoryFields.style.display = this.checked ? "block" : "none";
        });
    }
    
    function closeModal() {
        modal.classList.remove("active");
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
    
    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);
    
    updateBtn.addEventListener("click", () => updateProduct(productId));
    
    // Fechar ao clicar fora
    modal.addEventListener("click", function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function updateProduct(productId) {
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
        NotificationSystem.show("Produto não encontrado", "error");
        return;
    }
    
    const name = document.getElementById("edit-product-name").value.trim();
    const price = parseFloat(document.getElementById("edit-product-price").value);
    const category = document.getElementById("edit-product-category").value;
    const image = document.getElementById("edit-product-image").value.trim() || "📦";
    const description = document.getElementById("edit-product-description").value.trim();
    
    // Validar dados
    const product = { name, price, category, image, description };
    const errors = DataValidator.validateProduct(product);
    
    if (errors.length > 0) {
        NotificationSystem.show(errors[0], "error");
        return;
    }
    
    // Atualizar produto
    products[productIndex] = {
        ...products[productIndex],
        ...product
    };
    
    // Atualizar estoque se existir ou se for para adicionar
    const inventoryIndex = inventory.findIndex(i => i.productId === productId);
    const currentStock = document.getElementById("edit-current-stock");
    const minStock = document.getElementById("edit-min-stock");
    const addInventory = document.getElementById("add-inventory");
    
    if (currentStock && minStock) {
        // Atualizar estoque existente
        if (inventoryIndex !== -1) {
            inventory[inventoryIndex] = {
                ...inventory[inventoryIndex],
                currentStock: parseInt(currentStock.value) || 0,
                minStock: parseInt(minStock.value) || 5,
                alert: parseInt(currentStock.value) <= parseInt(minStock.value),
                lastUpdated: new Date().toISOString()
            };
        }
    } else if (addInventory && addInventory.checked) {
        // Adicionar novo controle de estoque
        const initialStock = parseInt(document.getElementById("add-initial-stock").value) || 0;
        const newMinStock = parseInt(document.getElementById("add-min-stock").value) || 5;
        
        inventory.push({
            productId: productId,
            productName: name,
            currentStock: initialStock,
            minStock: newMinStock,
            alert: initialStock <= newMinStock,
            lastUpdated: new Date().toISOString()
        });
    }
    
    // Salvar dados
    DataManager.saveAppData();
    
    // Atualizar view
    updateProdutosView();
    
    // Fechar modal
    const modal = document.getElementById("edit-product-modal");
    if (modal) {
        modal.classList.remove("active");
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
    
    NotificationSystem.show(`Produto "${name}" atualizado com sucesso!`, "success");
}

export function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        NotificationSystem.show("Produto não encontrado", "error");
        return;
    }
    
    NotificationSystem.confirm(
        `Deseja excluir o produto "${product.name}"? Esta ação não pode ser desfeita.`,
        "Excluir",
        "Cancelar"
    ).then((confirmed) => {
        if (confirmed) {
            // Remover produto
            const productIndex = products.findIndex(p => p.id === productId);
            if (productIndex !== -1) {
                products.splice(productIndex, 1);
            }
            
            // Remover estoque relacionado
            const inventoryIndex = inventory.findIndex(i => i.productId === productId);
            if (inventoryIndex !== -1) {
                inventory.splice(inventoryIndex, 1);
            }
            
            DataManager.saveAppData();
            updateProdutosView();
            
            NotificationSystem.show("Produto excluído com sucesso!", "success");
        }
    });
}

function filterProducts(searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
    );
    
    displayFilteredProducts(filtered);
}

function filterByCategory(category) {
    if (!category) {
        updateProdutosView();
        return;
    }
    
    const filtered = products.filter(product => product.category === category);
    displayFilteredProducts(filtered);
}

function displayFilteredProducts(filteredProducts) {
    const productsList = document.getElementById("products-list-container");
    if (!productsList) return;
    
    if (filteredProducts.length === 0) {
        productsList.innerHTML = `
            <div class="no-orders">
                <p>Nenhum produto encontrado</p>
            </div>
        `;
        return;
    }
    
    productsList.innerHTML = "";
    
    // Agrupar por categoria
    const productsByCategory = groupProductsByCategory(filteredProducts);
    
    Object.entries(productsByCategory).forEach(([category, categoryProducts]) => {
        const categorySection = document.createElement("div");
        categorySection.className = "category-section";
        categorySection.innerHTML = `
            <h4 class="category-title">${category} (${categoryProducts.length})</h4>
            <div class="category-products">
                ${categoryProducts.map(product => createProductCard(product)).join('')}
            </div>
        `;
        
        productsList.appendChild(categorySection);
    });
}

// Configurar event listeners para ações de produto
document.addEventListener('click', function(e) {
    if (e.target.closest('.edit-product')) {
        const productId = parseInt(e.target.closest('.edit-product').dataset.id);
        editProduct(productId);
    }
    
    if (e.target.closest('.delete-product')) {
        const productId = parseInt(e.target.closest('.delete-product').dataset.id);
        deleteProduct(productId);
    }
    
    if (e.target.closest('.edit-inventory')) {
        const productId = parseInt(e.target.closest('.edit-inventory').dataset.id);
        editProductInventory(productId);
    }
});

function editProductInventory(productId) {
    editProduct(productId); // Reutiliza a mesma função de edição
}