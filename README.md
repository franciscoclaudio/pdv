# Sistema PDV - Restaurantes & Bares

Sistema de Ponto de Venda completo para gerenciamento de restaurantes e bares, com controle de pedidos, mesas, cozinha, estoque e relatórios.

## 📁 Estrutura do Projeto

```
pdv-system/
├── index.html              # Página principal
├── style.css               # Estilos globais
├── images/                 # Imagens produtos 
├── script/
│   ├── main.js            # Ponto de entrada principal
│   ├── init.js            # Inicialização do sistema
│   ├── modules/
│   │   ├── auth.js        # Autenticação e login
│   │   ├── dataManager.js # Gerenciamento de dados e storage
│   │   ├── notifications.js # Sistema de notificações
│   │   ├── navigation.js  # Navegação e tabs
│   │   ├── pdv.js        # PDV e carrinho de compras
│   │   ├── orders.js     # Balcão e pedidos
│   │   ├── kitchen.js    # Cozinha e preparo
│   │   ├── tables.js     # Controle de mesas
│   │   ├── dashboard.js  # Dashboard e estatísticas
│   │   ├── reports.js    # Relatórios e exportações
│   │   ├── products.js   # Gestão de produtos
│   │   └── modals.js     # Modais (payment, mesa, order)
│   └── utils/
│       ├── constants.js  # Constantes e configurações
│       ├── helpers.js    # Funções auxiliares
│       └── validators.js # Validações de dados
└── README.md             # Este arquivo
```

## 🚀 Instalação e Uso

### Opção 1: Servidor Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/pdv-system.git

# Entre na pasta
cd pdv-system

# Inicie um servidor local (exemplo com Python)
python -m http.server 8000

# Ou com Node.js
npx serve

# Acesse http://localhost:8000
```

### Opção 2: Servidor Web

Faça upload dos arquivos para qualquer servidor web que suporte HTML, CSS e JavaScript.

## 👥 Usuários Demo

O sistema possui 4 perfis de usuário pré-configurados:

| Usuário  | Senha | Perfil      | Permissões |
|----------|-------|-------------|------------|
| garcom   | 123   | Garçom      | PDV, Pedidos, Mesas, Cozinha |
| caixa    | 123   | Caixa       | PDV, Pedidos, Mesas, Relatórios |
| cozinha  | 123   | Cozinha     | Cozinha |
| gestor   | 123   | Gestor      | Todas |

## 🏗️ Arquitetura

### Módulos Principais

#### 1. **auth.js** - Autenticação
- Login/Logout
- Gerenciamento de sessão
- Controle de permissões
- Timer de inatividade

#### 2. **dataManager.js** - Dados
- LocalStorage para persistência
- Backup e restauração
- Validação de dados
- Auto-save

#### 3. **notifications.js** - Notificações
- Sistema de alertas
- Diálogos de confirmação
- Prompts
- Loading states

#### 4. **navigation.js** - Navegação
- Controle de tabs
- Navegação por permissões
- Callbacks de mudança de aba

#### 5. **pdv.js** - Ponto de Venda
- Carrinho de compras
- Adição/remoção de produtos
- Cálculo de totais
- Finalização de pedidos

#### 6. **orders.js** - Balcão
- Gerenciamento de pedidos
- Status: pendente, preparando, pronto
- Busca e filtros

#### 7. **kitchen.js** - Cozinha
- Kanban de pedidos
- Controle de preparo
- Atualização de status

#### 8. **tables.js** - Mesas
- Controle de ocupação
- Visualização de pedidos
- Limpeza de mesas

#### 9. **dashboard.js** - Dashboard
- Estatísticas em tempo real
- Pedidos recentes
- Métricas do dia

#### 10. **reports.js** - Relatórios
- Relatórios de vendas
- Produtos mais vendidos
- Tempo de atendimento
- Exportação de dados

#### 11. **products.js** - Produtos
- CRUD de produtos
- Categorização
- Gestão de estoque

#### 12. **modals.js** - Modais
- Modal de novo pedido
- Modal de pagamento
- Modal de detalhes de mesa

### Utilitários

#### constants.js
Define todas as constantes do sistema:
- Usuários padrão
- Produtos iniciais
- Métodos de pagamento
- Status de pedidos
- Configurações gerais

#### helpers.js
Funções auxiliares:
- Formatação de moeda
- Formatação de data/hora
- Cálculos (subtotal, taxa de serviço)
- Busca e filtros
- Manipulação de strings

#### validators.js
Validações:
- Credenciais de usuário
- Pedidos
- Produtos
- Pagamentos
- Dados da aplicação

## 📊 Fluxo de Dados

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│    Auth     │────▶│  Navigation  │
└─────────────┘     └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │   PDV   │  │ Orders  │  │ Kitchen │
        └────┬────┘  └────┬────┘  └────┬────┘
             │            │            │
             └────────────┼────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │  DataManager  │
                  └───────────────┘
                          │
                          ▼
                   [LocalStorage]
```

## 🎨 Personalização

### Alterar Cores

Edite as variáveis CSS em `style.css`:

```css
:root {
  --primary-color: #af3a3a;      /* Cor principal */
  --secondary-color: #9c7424;    /* Cor secundária */
  --accent-color: #8a6561;       /* Cor de destaque */
  /* ... outras cores */
}
```

### Adicionar Produtos

Edite `utils/constants.js`:

```javascript
export const INITIAL_PRODUCTS = [
  {id: 1, name: "Novo Produto", price: 29.90, category: "Categoria", image: "🍔"},
  // ... mais produtos
];
```

### Modificar Permissões

Edite `utils/constants.js`:

```javascript
export const USERS = [
  {
    username: "novo_usuario",
    password: "senha",
    profile: "perfil",
    name: "Nome Completo",
    permissions: ["dashboard", "pdv", "pedidos"]
  }
];
```

## 🔒 Segurança

⚠️ **IMPORTANTE**: Este é um sistema de demonstração. Para uso em produção:

1. Implemente autenticação no backend
2. Use HTTPS
3. Criptografe senhas (bcrypt)
4. Valide dados no servidor
5. Implemente rate limiting
6. Use tokens JWT ou sessões seguras

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop (1920x1080+)
- Tablets (768px+)
- Mobile (320px+)

## 🌐 Navegadores Suportados

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Resolução de Problemas

### O sistema não carrega

1. Verifique o console do navegador (F12)
2. Certifique-se de que está usando um servidor (não `file://`)
3. Verifique se todos os arquivos estão no lugar correto

### Dados não são salvos

1. Verifique se o LocalStorage está habilitado
2. Limpe o cache do navegador
3. Verifique as permissões de cookies/storage

### Erros ao importar módulos

1. Use um servidor HTTP (não funciona com `file://`)
2. Verifique os caminhos dos imports
3. Certifique-se de usar `type="module"` no HTML

## 📝 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📧 Suporte

Para questões e suporte, abra uma issue no GitHub.

---

**Desenvolvido com ❤️ para a comunidade de restaurantes e bares**