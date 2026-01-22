// ===========================
// AUTH - Autenticação e Login
// ===========================

import { USERS, STORAGE_KEYS, CONFIG } from '../utils/constants.js';
import { validateUserCredentials } from '../utils/validators.js';
import { getProfileDisplayName, getInitials } from '../utils/helpers.js';
import { LocalStorageHelper, dataManager } from './dataManager.js';
import { NotificationSystem } from './notifications.js';

/**
 * Gerenciador de autenticação
 */
export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.inactivityTimer = null;
        this.eventListenersAdded = false;
    }

    /**
     * Inicializa sistema de login
     */
    initializeLogin() {
        // Carrega os dados primeiro para ter acesso aos funcionários
        dataManager.loadAppData();

        const loginForm = document.getElementById("login-form");
        const demoButtons = document.querySelectorAll(".demo-btn");
        const logoutBtn = document.getElementById("logout-btn");

        if (loginForm) {
            loginForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const username = document.getElementById("username").value.trim();
                const password = document.getElementById("password").value;
                this.authenticate(username, password);
            });
        }

        if (demoButtons) {
            demoButtons.forEach((btn) => {
                btn.addEventListener("click", () => {
                    const username = btn.getAttribute("data-user");
                    const password = btn.getAttribute("data-pass");

                    document.getElementById("username").value = username;
                    document.getElementById("password").value = password;

                    this.authenticate(username, password);
                });
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => this.logout());
        }
    }

    /**
     * Autentica usuário (usuários padrão + funcionários cadastrados)
     */
    authenticate(username, password) {
        const errors = validateUserCredentials(username, password);
        
        if (errors.length > 0) {
            NotificationSystem.error(errors[0]);
            return false;
        }

        // Primeiro verifica usuários padrão do sistema
        let user = USERS.find(
            u => u.username === username && u.password === password
        );

        // Se não encontrou, verifica funcionários cadastrados
        if (!user) {
            const employees = dataManager.employees || [];
            
            // Busca por email ou nome (case insensitive)
            const employee = employees.find(e => {
                const emailMatch = e.email && e.email.toLowerCase() === username.toLowerCase();
                const nameMatch = e.name.toLowerCase().replace(/\s+/g, '') === username.toLowerCase().replace(/\s+/g, '');
                return (emailMatch || nameMatch) && e.password === password;
            });

            if (employee) {
                console.log('✅ Funcionário encontrado:', employee.name, 'Cargo:', employee.role);
                user = this.convertEmployeeToUser(employee);
                console.log('✅ Usuário convertido com permissões:', user.permissions);
            }
        }

        if (user) {
            this.currentUser = user;
            LocalStorageHelper.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
            
            this.showMainSystem();
            NotificationSystem.success(`Bem-vindo, ${user.name}!`);
            console.log('🔐 Login bem-sucedido:', {
                name: user.name,
                profile: user.profile,
                permissions: user.permissions,
                isEmployee: user.isEmployee || false
            });
            
            this.setupInactivityTimer();
            return true;
        } else {
            NotificationSystem.error("Usuário ou senha inválidos!");
            return false;
        }
    }

    // No método convertEmployeeToUser, atualize o rolePermissions para incluir delivery
    convertEmployeeToUser(employee) {
        // Define permissões baseadas no cargo - INCLUINDO DELIVERY
        const rolePermissions = {
            'garcom': ["pdv", "pedidos", "mesas", "cozinha"], // ❌ SEM delivery
            'caixa': ["pdv", "pedidos", "mesas", "relatorios", "caixa", "delivery"], // ✅ COM delivery
            'cozinha': ["cozinha"], // ❌ SEM delivery
            'gestor': ["dashboard", "pdv", "pedidos", "cozinha", "mesas", "relatorios", "produtos", "funcionarios", "caixa", "delivery"], // ✅ COM delivery
            'gerente': ["dashboard", "pdv", "pedidos", "cozinha", "mesas", "relatorios", "produtos", "funcionarios", "caixa", "delivery"] // ✅ COM delivery
        };
        const validRole = employee.role && rolePermissions[employee.role] ? employee.role : 'garcom';
    
        return {
            username: employee.email || employee.name.toLowerCase().replace(/\s+/g, ''),
            password: employee.password,
            profile: validRole,  // ✅ Sempre válido
            name: employee.name,
            permissions: rolePermissions[validRole],  // ✅ Agora inclui delivery para os perfis certos
            isEmployee: true,
            employeeId: employee.id,
            email: employee.email || null,
            phone: employee.phone || null
        };
    }

    /**
     * Mostra sistema principal
     */
    showMainSystem() {
        const loginContainer = document.getElementById("login-container");
        const mainSystem = document.getElementById("main-system");

        if (loginContainer) loginContainer.style.display = "none";
        if (mainSystem) mainSystem.style.display = "block";

        this.updateUserInterface();
        
        // Dispara evento customizado para inicialização
        document.dispatchEvent(new CustomEvent('userLoggedIn', {
            detail: { user: this.currentUser }
        }));
    }

    /**
     * Atualiza interface com dados do usuário
     */
    updateUserInterface() {
        const userDisplayName = document.getElementById("user-display-name");
        const userRole = document.getElementById("user-role");
        const userAvatar = document.getElementById("user-avatar");

        if (userDisplayName && this.currentUser) {
            userDisplayName.textContent = this.currentUser.name;
        }
        
        if (userRole && this.currentUser) {
            userRole.textContent = getProfileDisplayName(this.currentUser.profile);
        }
        
        if (userAvatar && this.currentUser) {
            const initials = getInitials(this.currentUser.name);
            userAvatar.textContent = initials;
        }

        if (this.currentUser) {
            document.body.className = `user-${this.currentUser.profile}`;
        }
    }

    /**
     * Faz logout
     */
    logout() {
        this.clearInactivityTimer();
        
        this.currentUser = null;
        LocalStorageHelper.removeItem(STORAGE_KEYS.CURRENT_USER);

        const mainSystem = document.getElementById("main-system");
        const loginContainer = document.getElementById("login-container");

        if (mainSystem) mainSystem.style.display = "none";
        if (loginContainer) loginContainer.style.display = "flex";

        document.body.className = "";

        const loginForm = document.getElementById("login-form");
        if (loginForm) loginForm.reset();

        // Dispara evento customizado
        document.dispatchEvent(new Event('userLoggedOut'));

        NotificationSystem.success("Logout realizado com sucesso!");
    }

    /**
     * Restaura sessão salva
     */
    restoreSession() {
        const savedUser = LocalStorageHelper.getItem(STORAGE_KEYS.CURRENT_USER);
        
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.showMainSystem();
                this.setupInactivityTimer();
                return true;
            } catch (error) {
                console.error("Erro ao carregar usuário:", error);
                LocalStorageHelper.removeItem(STORAGE_KEYS.CURRENT_USER);
                return false;
            }
        }
        
        return false;
    }

    /**
     * Verifica se usuário tem permissão
     */
    hasPermission(permission) {
        if (!this.currentUser || !Array.isArray(this.currentUser.permissions)) {
            return false;
        }
        return this.currentUser.permissions.includes(permission);
    }

    /**
     * Verifica se tem permissão de atendimento
     */
    hasAtendimentoPermission() {
        return ["pdv", "pedidos", "mesas"].some(p => this.hasPermission(p));
    }

    /**
     * Configura timer de inatividade
     */
    setupInactivityTimer() {
        if (this.eventListenersAdded) return;

        const events = ["mousemove", "keypress", "click", "scroll", "touchstart"];
        
        events.forEach((event) => {
            document.addEventListener(event, () => this.resetInactivityTimer(), {
                passive: true
            });
        });

        this.eventListenersAdded = true;
        this.resetInactivityTimer();
    }

    /**
     * Reseta timer de inatividade
     */
    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }

        this.inactivityTimer = setTimeout(() => {
            if (this.currentUser) {
                NotificationSystem.warning("Sessão expirada por inatividade");
                this.logout();
            }
        }, CONFIG.INACTIVITY_TIMEOUT);
    }

    /**
     * Limpa timer de inatividade
     */
    clearInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }

    /**
     * Obtém usuário atual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Verifica se está logado
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Exporta instância singleton
export const authManager = new AuthManager();