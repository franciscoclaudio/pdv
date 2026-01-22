// ===========================
// PRODUCTS - Gestão de Produtos (ATUALIZADO COM TEXTO CENTRALIZADO)
// ===========================

import { dataManager } from './dataManager.js';
import { NotificationSystem } from './notifications.js';
import { formatCurrency, generateProductId, renderProductImage } from '../utils/helpers.js';
import { validateProduct } from '../utils/validators.js';


export class ProductsManager {
    constructor() {
        this.initialized = false;
        this.editingId = null;
        this.uploadedImage = null;
    }

    initialize() {
        if (this.initialized) return;
        this.initialized = true;

        this.setupEventListeners();
        this.injectStyles(); // Injeta estilos CSS
        this.updateView();
    }

    /**
     * Injeta estilos CSS para centralizar textos
     */
    injectStyles() {
        // Remove estilos anteriores se existirem
        const existingStyle = document.getElementById('products-custom-styles');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'products-custom-styles';
        style.textContent = `
            /* Estilos para centralizar textos na aba de produtos */
            .grid-cadastro {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 20px;
                padding: 20px;
                width: 100%;
            }

            .card-item {
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                padding: 20px;
                background: white;
                box-shadow: 0 3px 10px rgba(0,0,0,0.08);
                transition: all 0.3s ease;
                display: flex;
                flex-direction: column;
                align-items: center; /* Centraliza horizontalmente */
                text-align: center; /* Centraliza texto */
                height: 100%;
            }

            .card-item:hover {
                transform: translateY(-4px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.12);
                border-color: #3498db;
            }

            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
                margin-bottom: 15px;
            }

            .card-badge {
                background: #3498db;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 500;
            }

            .actions {
                display: flex;
                gap: 8px;
            }

            .btn-icon {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 1.2rem;
                padding: 6px;
                border-radius: 50%;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
            }

            .btn-icon:hover {
                background: #f5f5f5;
                transform: scale(1.1);
            }

            .btn-icon.danger:hover {
                background: #ffebee;
                color: #e74c3c;
            }

            .card-item h4 {
                margin: 0 0 10px 0;
                font-size: 1.2rem;
                color: #2c3e50;
                width: 100%;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }

            /* Status badge dentro do h4 */
            .card-item h4 span {
                margin-left: 0;
                margin-top: 4px;
            }

            .card-item p {
                margin: 8px 0;
                width: 100%;
                text-align: center;
                line-height: 1.5;
            }

            /* Container da imagem centralizada */
            .product-image-container {
                width: 160px;
                height: 160px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 15px auto;
                overflow: hidden;
                border-radius: 10px;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            }

            .product-image-container img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            }

            .product-image-container .image-placeholder {
                font-size: 3.5rem;
                color: #95a5a6;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
            }

            .price {
                font-size: 1.4rem;
                font-weight: bold;
                color: #27ae60;
                margin: 15px 0;
                background: #f8fff8;
                padding: 10px 20px;
                border-radius: 8px;
                display: inline-block;
            }

            /* Textos de descrição */
            .card-item p[style*="color: #666"] {
                color: #666 !important;
                font-size: 0.95rem !important;
                margin: 10px 0 !important;
                text-align: center !important;
                width: 100% !important;
                line-height: 1.4 !important;
                min-height: 40px;
            }

            /* Texto SKU */
            .card-item p[style*="color: #999"] {
                color: #999 !important;
                font-size: 0.85rem !important;
                margin: 5px 0 !important;
                text-align: center !important;
                width: 100% !important;
                font-style: italic;
            }

            /* Mensagem de nenhum produto */
            .no-data {
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                color: #7f8c8d;
                font-size: 1.2rem;
                background: #f8f9fa;
                border-radius: 12px;
                margin: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }

            /* Responsividade */
            @media (max-width: 1024px) {
                .grid-cadastro {
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 16px;
                    padding: 16px;
                }
                
                .product-image-container {
                    width: 140px;
                    height: 140px;
                }
            }

            @media (max-width: 768px) {
                .grid-cadastro {
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 14px;
                    padding: 14px;
                }
                
                .card-item {
                    padding: 16px;
                }
                
                .product-image-container {
                    width: 120px;
                    height: 120px;
                }
                
                .card-item h4 {
                    font-size: 1.1rem;
                }
                
                .price {
                    font-size: 1.2rem;
                }
            }

            @media (max-width: 480px) {
                .grid-cadastro {
                    grid-template-columns: 1fr;
                    gap: 12px;
                    padding: 12px;
                }
                
                .card-item {
                    padding: 14px;
                }
                
                .product-image-container {
                    width: 100px;
                    height: 100px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        const form = document.getElementById("product-form");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        // Upload de imagem
        const imageInput = document.getElementById("product-image");
        if (imageInput) {
            imageInput.addEventListener("change", (e) => {
                this.handleImageUpload(e);
            });
        }

        // Formatação de preço
        const priceInput = document.getElementById("product-price");
        if (priceInput) {
            priceInput.addEventListener("input", (e) => {
                this.formatPriceInput(e);
            });
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            NotificationSystem.error("Por favor, selecione uma imagem válida!");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.uploadedImage = e.target.result;
            
            const preview = document.getElementById("image-preview");
            const previewImg = document.getElementById("preview-img");
            
            if (preview && previewImg) {
                previewImg.src = this.uploadedImage;
                preview.style.display = "block";
            }
        };
        reader.readAsDataURL(file);
    }

    formatPriceInput(event) {
        let value = event.target.value.replace(/\D/g, '');
        
        if (value.length === 0) {
            event.target.value = '';
            return;
        }

        value = (parseInt(value) / 100).toFixed(2);
        event.target.value = value.replace('.', ',');
    }

    handleSubmit() {
        const name = document.getElementById("product-name").value.trim();
        const description = document.getElementById("product-description").value.trim();
        const priceStr = document.getElementById("product-price").value.replace(',', '.');
        const category = document.getElementById("product-category").value || 'Lanches';
        const sku = document.getElementById("product-sku").value.trim();
        const active = document.getElementById("product-active").checked;
        const salon = document.getElementById("product-salon").checked;
        const delivery = document.getElementById("product-delivery").checked;

        // Validações
        if (!name) {
            NotificationSystem.error("Nome do produto é obrigatório!");
            return;
        }

        if (!description) {
            NotificationSystem.error("Descrição é obrigatória!");
            return;
        }

        const price = parseFloat(priceStr);
        if (isNaN(price) || price <= 0) {
            NotificationSystem.error("Preço inválido!");
            return;
        }

        const productData = {
            name,
            description,
            price,
            category,
            sku: sku || this.generateSKU(),
            image: this.uploadedImage || "📦",
            active,
            availableFor: {
                salon,
                delivery
            }
        };

        if (this.editingId) {
            this.updateProduct(this.editingId, productData);
        } else {
            this.addProduct(productData);
        }
    }

    generateSKU() {
        return 'PRD-' + Date.now().toString().slice(-6);
    }

    addProduct(productData) {
        const newProduct = {
            id: generateProductId(dataManager.products),
            ...productData,
            createdAt: new Date().toISOString()
        };

        const validationErrors = validateProduct(newProduct);
        if (validationErrors.length > 0) {
            NotificationSystem.error(validationErrors[0]);
            return;
        }

        dataManager.products.push(newProduct);
        dataManager.saveAppData();
        
        this.clearForm();
        this.updateView();
        
        // NOTIFICAÇÃO PARA O PDV ATUALIZAR
        document.dispatchEvent(new CustomEvent('productListUpdated', {
            detail: { 
                action: 'added',
                product: newProduct,
                allProducts: dataManager.products
            }
        }));

        NotificationSystem.success(`Produto "${newProduct.name}" cadastrado com sucesso!`);
    }

    updateProduct(id, productData) {
        const product = dataManager.products.find(p => p.id === id);
        if (!product) {
            NotificationSystem.error("Produto não encontrado!");
            return;
        }

        Object.assign(product, productData);
        product.updatedAt = new Date().toISOString();

        const validationErrors = validateProduct(product);
        if (validationErrors.length > 0) {
            NotificationSystem.error(validationErrors[0]);
            return;
        }

        dataManager.saveAppData();
        
        this.clearForm();
        this.editingId = null;
        this.updateView();

        // NOTIFICAÇÃO PARA O PDV ATUALIZAR
        document.dispatchEvent(new CustomEvent('productListUpdated', {
            detail: { 
                action: 'updated',
                product: product,
                allProducts: dataManager.products
            }
        }));

        NotificationSystem.success("Produto atualizado com sucesso!");
    }

    editProduct(productId) {
        const product = dataManager.products.find(p => p.id === productId);
        if (!product) {
            NotificationSystem.error("Produto não encontrado!");
            return;
        }

        document.getElementById("product-name").value = product.name;
        document.getElementById("product-description").value = product.description || '';
        document.getElementById("product-price").value = product.price.toFixed(2).replace('.', ',');
        document.getElementById("product-category").value = product.category || 'Lanches';
        document.getElementById("product-sku").value = product.sku || '';
        document.getElementById("product-active").checked = product.active !== false;
        document.getElementById("product-salon").checked = product.availableFor?.salon !== false;
        document.getElementById("product-delivery").checked = product.availableFor?.delivery !== false;

        if (typeof product.image === 'string' && product.image.startsWith('data:image')) {
            this.uploadedImage = product.image;
            const preview = document.getElementById("image-preview");
            const previewImg = document.getElementById("preview-img");
            
            if (preview && previewImg) {
                previewImg.src = this.uploadedImage;
                preview.style.display = "block";
            }
        }

        this.editingId = productId;

        // Scroll para o formulário
        document.getElementById("product-form").scrollIntoView({ behavior: 'smooth' });
    }

    deleteProduct(productId) {
        const product = dataManager.products.find(p => p.id === productId);
        if (!product) {
            NotificationSystem.error("Produto não encontrado!");
            return;
        }

        NotificationSystem.confirm(
            `Deseja realmente excluir "${product.name}"?`,
            "Excluir",
            "Cancelar"
        ).then((confirmed) => {
            if (confirmed) {
                const index = dataManager.products.findIndex(p => p.id === productId);
                if (index !== -1) {
                    dataManager.products.splice(index, 1);
                    dataManager.saveAppData();
                    this.updateView();

                    // NOTIFICAÇÃO PARA O PDV ATUALIZAR
                    document.dispatchEvent(new CustomEvent('productListUpdated', {
                        detail: { 
                            action: 'deleted',
                            productId: productId,
                            allProducts: dataManager.products
                        }
                    }));

                    NotificationSystem.success("Produto excluído com sucesso!");
                }
            }
        });
    }

    clearForm() {
        document.getElementById("product-form").reset();
        this.editingId = null;
        this.uploadedImage = null;
        
        const preview = document.getElementById("image-preview");
        if (preview) {
            preview.style.display = "none";
        }
    }

    /**
     * Atualiza visualização com cards
     */
    updateView() {
        const container = document.getElementById("products-list-container");
        if (!container) return;
    
        container.innerHTML = "";
        container.className = "grid-cadastro";
    
        if (dataManager.products.length === 0) {
            container.innerHTML = '<div class="no-data">Nenhum produto cadastrado.</div>';
            return;
        }
    
        dataManager.products.forEach(product => {
            const card = document.createElement("div");
            card.className = "card-item";
            
            // USANDO A MESMA FUNÇÃO
            const imageHtml = renderProductImage(product.image, product.name);
            
            const statusBadge = product.active !== false ? 
                '<span style="background: #27ae60; color: white; padding: 2px 8px; border-radius: 999px; font-size: 0.7rem;">Ativo</span>' :
                '<span style="background: #95a5a6; color: white; padding: 2px 8px; border-radius: 999px; font-size: 0.7rem;">Inativo</span>';
            
            card.innerHTML = `
                <div class="card-header">
                    <span class="card-badge">${product.category || 'Sem Categoria'}</span>
                    <div class="actions">
                        <button class="btn-icon" data-id="${product.id}" data-action="edit" title="Editar">
                            ✏️
                        </button>
                        <button class="btn-icon danger" data-id="${product.id}" data-action="delete" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </div>
                <h4>${product.name}<br>${statusBadge}</h4>
                <p>${product.description || ''}</p>
                <div class="product-image-container">
                    ${imageHtml}
                </div>
                <p class="price">R$ ${product.price.toFixed(2)}</p>
                ${product.sku ? `<p>SKU: ${product.sku}</p>` : ''}
            `;
            
            // Event listeners
            const editBtn = card.querySelector('[data-action="edit"]');
            const deleteBtn = card.querySelector('[data-action="delete"]');
            
            if (editBtn) {
                editBtn.addEventListener('click', () => this.editProduct(product.id));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteProduct(product.id));
            }
            
            container.appendChild(card);
        });
    }
}

export const productsManager = new ProductsManager();