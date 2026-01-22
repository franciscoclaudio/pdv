# 🍽️ Sistema PDV - Restaurantes & Bares

Sistema completo de Ponto de Venda para gerenciamento de restaurantes e bares, com controle de pedidos, mesas, delivery, cozinha, caixa, estoque e relatórios avançados.

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

---

## 📁 Estrutura do Projeto

```
pdv-system/
├── index.html                    # Página principal do sistema
├── style.css                     # Estilos globais e responsivos
├── README.md                     # Documentação (este arquivo)
├── images/                       # Imagens dos produtos
│   ├── pizza-margherita.jpg
│   ├── pizza-calabresa.jpg
│   └── ...
└── script/
    ├── main.js                   # Ponto de entrada principal
    ├── init.js                   # Inicialização e configuração
    ├── logo.js                   # Gerenciamento de logomarca
    │
    ├── modules/                  # Módulos principais do sistema
    │   ├── auth.js               # 🔐 Autenticação e controle de acesso
    │   ├── dataManager.js        # 💾 Gerenciamento de dados e storage
    │   ├── notifications.js      # 🔔 Sistema de notificações
    │   ├── navigation.js         # 🧭 Navegação entre abas e dropdowns
    │   ├── pdv.js                # 💳 PDV (Mesa, Balcão, Delivery)
    │   ├── orders.js             # 📋 Gestão de pedidos do balcão
    │   ├── kitchen.js            # 👨‍🍳 Controle da cozinha (kanban)
    │   ├── tables.js             # 🪑 Controle de mesas
    │   ├── delivery.js           # 🛵 Gestão de delivery
    │   ├── dashboard.js          # 📊 Dashboard e estatísticas
    │   ├── reports.js            # 📈 Relatórios e exportação PDF
    │   ├── products.js           # 🍕 Cadastro de produtos
    │   ├── employees.js          # 👥 Cadastro de funcionários
    │   ├── caixa.js              # 💰 Controle de caixa
    │   └── modals.js             # 🪟 Modais (pedidos, mesas, pagamento)
    │
    └── utils/                    # Utilitários e helpers
        ├── constants.js          # 🔧 Constantes e configurações
        ├── helpers.js            # 🛠️ Funções auxiliares
        └── validators.js         # ✅ Validações de dados
```

---

## 🚀 Instalação e Uso

### Opção 1: Servidor Local Simples

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/pdv-system.git

# Entre na pasta
cd pdv-system

# Inicie um servidor local
# Com Python 3:
python -m http.server 8000

# Ou com Python 2:
python -m SimpleHTTPServer 8000

# Ou com Node.js:
npx serve

# Ou com PHP:
php -S localhost:8000

# Acesse no navegador:
http://localhost:8000
```

### Opção 2: Hospedagem Web

Faça upload dos arquivos para qualquer servidor web que suporte HTML, CSS e JavaScript estático.

**✅ Compatível com:**
- Apache
- Nginx
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

---

## 👥 Usuários e Perfis

O sistema possui **4 perfis de acesso** pré-configurados:

| Usuário  | Senha | Perfil      | Permissões |
|----------|-------|-------------|------------|
| `garcom`   | `123`   | Garçom      | PDV, Pedidos, Mesas, Cozinha |
| `caixa`    | `123`   | Caixa       | PDV, Pedidos, Mesas, Relatórios, Caixa, Delivery |
| `cozinha`  | `123`   | Cozinha     | Cozinha |
| `gestor`   | `123`   | Gestor      | **Acesso Total** |

### 🆕 Funcionários Personalizados

Além dos usuários padrão, você pode **cadastrar funcionários** com permissões personalizadas:

- Acesse **Cadastro → Funcionários**
- Preencha: Nome, E-mail, Telefone, Cargo, Senha
- Funcionários podem fazer login usando **nome** ou **e-mail**

---

## 🎯 Funcionalidades Principais

### 1. 💳 **PDV (Ponto de Venda)**
- ✅ Criação de pedidos para **Mesa**, **Balcão** e **Delivery**
- ✅ Adicionar/remover produtos com controle de estoque
- ✅ Cálculo automático: Subtotal + Taxa de Serviço (10%)
- ✅ Campos específicos para delivery (telefone e endereço)
- ✅ Categorias de produtos padronizadas
- ✅ Imagens de produtos (145x145px fixas)

### 2. 🪑 **Controle de Mesas**
- ✅ 15 mesas com status visual: Livre, Ocupada, Limpando
- ✅ Abertura de mesas com pedido integrado
- ✅ Visualização detalhada do pedido da mesa
- ✅ Adicionar itens em mesas ocupadas
- ✅ Fechamento de conta integrado

### 3. 🛵 **Delivery**
- ✅ Kanban visual: Pendente → Preparando → Em Rota → Entregue
- ✅ Estatísticas de delivery em tempo real
- ✅ Controle de pagamentos pendentes
- ✅ Registro de endereço e telefone
- ✅ Histórico completo de entregas

### 4. 👨‍🍳 **Cozinha**
- ✅ Kanban de pedidos: Pendentes → Preparando → Prontos
- ✅ Controle de tempo de preparo
- ✅ Atualização de status em tempo real
- ✅ Visualização por tipo de pedido

### 5. 💰 **Caixa**
- ✅ Abertura de caixa com saldo inicial
- ✅ Movimentações: Entradas e Saídas
- ✅ Fechamento detalhado por forma de pagamento:
  - 💵 Dinheiro (com cálculo de troco)
  - 💳 Cartão
  - 📱 PIX
  - 🍴 Vale Refeição
- ✅ Relatório de fechamento em PDF
- ✅ Histórico de caixas anteriores

### 6. 📊 **Dashboard**
- ✅ Vendas do dia em tempo real
- ✅ Pedidos ativos e finalizados
- ✅ Mesas ocupadas/disponíveis
- ✅ Clientes atendidos
- ✅ Últimos 5 pedidos

### 7. 📈 **Relatórios Avançados**
- ✅ **Resumo Visual** com sparklines (últimos 7 dias)
- ✅ **Botões Rápidos:**
  - Vendas Diárias, Semanais, Mensais
  - Total por Cartão, Dinheiro, PIX
- ✅ **Exportação PDF** com logo e detalhes
- ✅ **Backup e Restore** de dados completo
- ✅ Filtros personalizados por período

### 8. 🍕 **Cadastro de Produtos**
- ✅ Layout otimizado em 2 colunas
- ✅ Formulário fixo (sticky) à esquerda
- ✅ Lista de produtos com scroll independente
- ✅ Upload de imagens ou uso de emojis
- ✅ Categorias padronizadas
- ✅ Controle de disponibilidade (Salão/Delivery)

### 9. 👥 **Cadastro de Funcionários**
- ✅ Layout otimizado em 2 colunas
- ✅ Formulário fixo (sticky) à esquerda
- ✅ Tabela com scroll independente
- ✅ Definição de cargo e permissões
- ✅ Login por nome ou e-mail
- ✅ Visualização de credenciais

### 10. 🔐 **Sistema de Autenticação**
- ✅ Login com usuário/senha
- ✅ Controle de permissões por perfil
- ✅ Timer de inatividade (30 minutos)
- ✅ Sessão salva em localStorage

---

## 🏗️ Arquitetura Técnica

### Módulos Principais

#### 🔐 **auth.js** - Autenticação
```javascript
// Gerencia login, logout e permissões
authManager.authenticate(username, password)
authManager.hasPermission(permission)
authManager.getCurrentUser()
```

#### 💾 **dataManager.js** - Dados
```javascript
// Gerencia localStorage e persistência
dataManager.saveAppData()
dataManager.loadAppData()
dataManager.exportData()
dataManager.importData(file)
```

#### 🔔 **notifications.js** - Notificações
```javascript
// Sistema de alertas e confirmações
NotificationSystem.success(message)
NotificationSystem.error(message)
NotificationSystem.confirm(message, confirmText, cancelText)
NotificationSystem.prompt(message, defaultValue)
```

#### 🧭 **navigation.js** - Navegação
```javascript
// Controle de abas e dropdowns
navigationManager.goToTab(tabId)
navigationManager.onTabChange(callback)
navigationManager.applyPermissions()
```

#### 💳 **pdv.js** - PDV
```javascript
// Ponto de Venda completo
pdvManager.addToOrder(product)
pdvManager.finalizeOrder()
pdvManager.loadProducts(category)
pdvManager.updateOrderSummary()
```

### Fluxo de Dados

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│    Auth     │────▶│  Navigation  │
└─────────────┘     └──────┬───────┘
                           │
              ┌────────────┼────────────────┐
              │            │                │
              ▼            ▼                ▼
        ┌─────────┐  ┌─────────┐     ┌──────────┐
        │   PDV   │  │ Orders  │     │ Delivery │
        └────┬────┘  └────┬────┘     └────┬─────┘
             │            │                │
             └────────────┼────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  DataManager  │
                  └───────────────┘
                          │
                          ▼
                   [LocalStorage]
```

---

## 🎨 Personalização

### Alterar Cores

Edite as variáveis CSS em `style.css`:

```css
:root {
  --primary-color: #af3a3a;      /* Cor principal (vermelho) */
  --secondary-color: #9c7424;    /* Cor secundária (dourado) */
  --accent-color: #8a6561;       /* Cor de destaque */
  --success-color: #27ae60;      /* Verde de sucesso */
  --warning-color: #f39c12;      /* Laranja de aviso */
  --danger-color: #e74c3c;       /* Vermelho de erro */
  /* ... outras cores */
}
```

### Adicionar Produtos Iniciais

Edite `script/utils/constants.js`:

```javascript
export const INITIAL_PRODUCTS = [
  {
    id: 1, 
    name: "Novo Produto", 
    price: 29.90, 
    category: "Lanches", 
    image: "../images/produto.jpg" // ou emoji: "🍔"
  },
  // ... mais produtos
];
```

### Modificar Permissões

Edite `script/utils/constants.js`:

```javascript
export const ROLE_PERMISSIONS = {
  garcom: ["pdv", "pedidos", "mesas", "cozinha"],
  caixa: ["pdv", "pedidos", "mesas", "relatorios", "caixa", "delivery"],
  cozinha: ["cozinha"],
  gestor: ["dashboard", "pdv", "pedidos", "cozinha", "mesas", 
           "relatorios", "produtos", "funcionarios", "caixa", "delivery"]
};
```

### Personalizar Logo

1. **Via Interface:**
   - Faça login
   - Na sidebar, clique em "Carregar Logomarca"
   - Selecione sua imagem (PNG, JPG)
   - A logo aparecerá na sidebar e no login

2. **Manualmente:**
   - Coloque sua imagem em `images/logo.png`
   - Edite `script/logo.js` se necessário

---

## 🔒 Segurança

⚠️ **IMPORTANTE**: Este é um sistema de **demonstração/protótipo**. 

Para uso em **produção**, implemente:

### Checklist de Segurança:

- [ ] **Backend com API REST** (Node.js, PHP, Python, etc.)
- [ ] **Banco de Dados** (PostgreSQL, MySQL, MongoDB)
- [ ] **HTTPS obrigatório** com certificado SSL/TLS
- [ ] **Hash de senhas** com bcrypt ou Argon2
- [ ] **Autenticação JWT** ou sessões seguras
- [ ] **Validação no servidor** (não confiar no frontend)
- [ ] **Rate Limiting** para prevenir ataques
- [ ] **CORS configurado** corretamente
- [ ] **Sanitização de inputs** (SQL Injection, XSS)
- [ ] **Logs de auditoria** de todas as ações
- [ ] **Backup automático** do banco de dados

### Recomendações:

```javascript
// ❌ NÃO FAÇA (atual - apenas demonstração):
localStorage.setItem('currentUser', JSON.stringify(user));

// ✅ FAÇA (produção):
// 1. Login via API POST /auth/login
// 2. Receba JWT token
// 3. Armazene em HttpOnly Cookie
// 4. Valide token em cada requisição
```

---

## 📱 Responsividade

O sistema é **100% responsivo** e funciona em:

| Dispositivo | Resolução | Status |
|-------------|-----------|--------|
| Desktop     | 1920x1080+ | ✅ Otimizado |
| Laptop      | 1366x768  | ✅ Otimizado |
| Tablet      | 768px+    | ✅ Adaptado |
| Mobile      | 320px+    | ✅ Funcional |

### Breakpoints:

- **Desktop:** > 1200px (layout completo)
- **Tablet:** 768px - 1200px (layout adaptado)
- **Mobile:** < 768px (layout vertical)

---

## 🌐 Navegadores Suportados

| Navegador | Versão Mínima | Status |
|-----------|---------------|--------|
| Chrome    | 90+           | ✅ Suportado |
| Firefox   | 88+           | ✅ Suportado |
| Safari    | 14+           | ✅ Suportado |
| Edge      | 90+           | ✅ Suportado |
| Opera     | 76+           | ✅ Suportado |

**Nota:** Internet Explorer não é suportado (ES6 Modules).

---

## 🐛 Resolução de Problemas

### ❌ Sistema não carrega

1. Abra o Console (F12)
2. Verifique erros de CORS
3. **Use um servidor HTTP** (não funciona com `file://`)
4. Verifique se todos os arquivos estão no lugar

### ❌ Dados não são salvos

1. Verifique se LocalStorage está habilitado no navegador
2. Limpe o cache (Ctrl+Shift+Del)
3. Verifique quota de armazenamento (5MB limite)
4. Teste em modo anônimo/privado

### ❌ Erros ao importar módulos

```
Uncaught SyntaxError: Cannot use import statement outside a module
```

**Solução:**
- Use um **servidor HTTP** (não `file://`)
- Verifique `<script type="module">` no HTML

### ❌ Modal não abre

1. Verifique Console para erros
2. Limpe cache do navegador
3. Recarregue a página (F5)

### ❌ PDV não finaliza pedido

1. Verifique se há itens no carrinho
2. Confira permissões do usuário
3. Para delivery, preencha todos os campos obrigatórios

---

## 📊 Dados Persistentes

O sistema utiliza **localStorage** do navegador:

```javascript
// Estrutura de dados salvos:
{
  orders: [],        // Pedidos
  mesas: [],         // Mesas
  products: [],      // Produtos
  employees: [],     // Funcionários
  inventory: [],     // Estoque
  caixa: {},         // Dados do caixa
  lastUpdate: "...", // Timestamp
  version: "2.0"     // Versão
}
```

### Backup e Restore:

1. **Exportar:** Relatórios → Exportar Backup → `backup_pdv_YYYY-MM-DD.json`
2. **Importar:** Relatórios → Importar Backup → Selecionar arquivo

---

## 🎯 Roadmap Futuro

### Versão 2.1 (Em desenvolvimento)
- [ ] Integração com impressora térmica
- [ ] Notificações push
- [ ] Modo offline (Service Worker)
- [ ] Multi-idioma (i18n)

### Versão 3.0 (Planejado)
- [ ] Backend completo (Node.js + PostgreSQL)
- [ ] API REST documentada
- [ ] App Mobile (React Native)
- [ ] Dashboard analítico avançado
- [ ] Integração com pagamento online

---

## 📝 Licença

Este projeto está sob a licença **MIT**.

```
Copyright (c) 2024 Sistema PDV

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🤝 Contribuindo

Contribuições são **muito bem-vindas**! 

### Como contribuir:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature
   ```bash
   git checkout -b feature/MinhaFeature
   ```
3. **Commit** suas mudanças
   ```bash
   git commit -m 'Adiciona MinhaFeature'
   ```
4. **Push** para a branch
   ```bash
   git push origin feature/MinhaFeature
   ```
5. Abra um **Pull Request**

### Diretrizes:

- ✅ Mantenha o código limpo e comentado
- ✅ Siga a estrutura existente
- ✅ Teste antes de fazer PR
- ✅ Documente novas funcionalidades

---

## 📧 Suporte

Para dúvidas, sugestões ou reportar bugs:

- 🐛 Abra uma [Issue](https://github.com/seu-usuario/pdv-system/issues)
- 💬 Discussões: [GitHub Discussions](https://github.com/seu-usuario/pdv-system/discussions)
- 📧 E-mail: suporte@seudominio.com

---

## 🏆 Agradecimentos

- **Claude (Anthropic)** - Assistente de desenvolvimento
- **Comunidade Open Source** - Bibliotecas utilizadas
- **Desenvolvedores** - Feedback e contribuições

---

## 📸 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### PDV
![PDV](docs/screenshots/pdv.png)

### Delivery
![Delivery](docs/screenshots/delivery.png)

### Relatórios
![Relatórios](docs/screenshots/relatorios.png)

---

<div align="center">

**Desenvolvido com ❤️ para a comunidade de restaurantes e bares**

⭐ **Star** este projeto se ele foi útil!

[🐛 Reportar Bug](https://github.com/seu-usuario/pdv-system/issues) • 
[💡 Sugerir Feature](https://github.com/seu-usuario/pdv-system/issues) • 
[📖 Documentação](https://github.com/seu-usuario/pdv-system/wiki)

</div>

---

## 📈 Estatísticas do Projeto

![GitHub stars](https://img.shields.io/github/stars/seu-usuario/pdv-system)
![GitHub forks](https://img.shields.io/github/forks/seu-usuario/pdv-system)
![GitHub issues](https://img.shields.io/github/issues/seu-usuario/pdv-system)
![GitHub license](https://img.shields.io/github/license/seu-usuario/pdv-system)

**Última atualização:** Janeiro 2026
**Versão atual:** 2.0
**Status:** ✅ Ativo e mantido