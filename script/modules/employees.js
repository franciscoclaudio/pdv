// ==========================================
// EMPLOYEES - Gestão de Funcionários (ATUALIZADO)
// ==========================================

import { dataManager } from './dataManager.js';
import { NotificationSystem } from './notifications.js';
import { ROLE_PERMISSIONS } from '../utils/constants.js'; // ← ADICIONAR ESTA LINHA


export class EmployeesManager {
    constructor() {
        this.initialized = false;
        this.editingId = null;
    }

    initialize() {
        if (this.initialized) return;
        this.initialized = true;

        this.setupEventListeners();
        this.updateView();
    }

    setupEventListeners() {
        const form = document.getElementById("employee-form");
        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        // Toggle de senha
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const input = document.getElementById(targetId);
                if (input) {
                    input.type = input.type === 'password' ? 'text' : 'password';
                }
            });
        });
    }

    handleSubmit() {
        const name = document.getElementById("employee-name").value.trim();
        const email = document.getElementById("employee-email").value.trim();
        const phone = document.getElementById("employee-phone").value.trim();
        const role = document.getElementById("employee-role").value;
        const password = document.getElementById("employee-password").value;
        const confirmPassword = document.getElementById("employee-confirm-password").value;

        // Validações
        if (!name) {
            NotificationSystem.error("Nome é obrigatório!");
            return;
        }

        if (!role) {
            NotificationSystem.error("Selecione um cargo!");
            return;
        }

        if (!password) {
            NotificationSystem.error("Senha é obrigatória!");
            return;
        }

        if (password !== confirmPassword) {
            NotificationSystem.error("As senhas não coincidem!");
            return;
        }

        if (password.length < 3) {
            NotificationSystem.error("A senha deve ter pelo menos 3 caracteres!");
            return;
        }

        if (this.editingId) {
            this.updateEmployee(this.editingId, { name, email, phone, role, password });
        } else {
            this.addEmployee({ name, email, phone, role, password });
        }
    }

    addEmployee(data) {
        if (!dataManager.employees) dataManager.employees = [];

        const newEmployee = {
            id: Date.now().toString(),
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: data.role,
            password: data.password,
            createdAt: new Date().toISOString()
        };

        dataManager.employees.push(newEmployee);
        dataManager.saveAppData();
        
        this.clearForm();
        this.updateView();
        
        NotificationSystem.success(`Funcionário "${data.name}" cadastrado com sucesso!`);
    }

    updateEmployee(id, data) {
        const employee = dataManager.employees.find(e => e.id === id);
        if (!employee) {
            NotificationSystem.error("Funcionário não encontrado!");
            return;
        }

        employee.name = data.name;
        employee.email = data.email;
        employee.phone = data.phone;
        employee.role = data.role;
        employee.password = data.password;
        employee.updatedAt = new Date().toISOString();

        dataManager.saveAppData();
        
        this.clearForm();
        this.editingId = null;
        this.updateView();
        
        NotificationSystem.success("Funcionário atualizado com sucesso!");
    }

    editEmployee(id) {
        const employee = dataManager.employees.find(e => e.id === id);
        if (!employee) {
            NotificationSystem.error("Funcionário não encontrado!");
            return;
        }

        document.getElementById("employee-name").value = employee.name;
        document.getElementById("employee-email").value = employee.email || '';
        document.getElementById("employee-phone").value = employee.phone || '';
        document.getElementById("employee-role").value = employee.role;
        document.getElementById("employee-password").value = employee.password;
        document.getElementById("employee-confirm-password").value = employee.password;

        this.editingId = id;

        // Scroll para o formulário
        document.getElementById("employee-form").scrollIntoView({ behavior: 'smooth' });
    }

    deleteEmployee(id) {
        const employee = dataManager.employees.find(e => e.id === id);
        if (!employee) {
            NotificationSystem.error("Funcionário não encontrado!");
            return;
        }

        NotificationSystem.confirm(
            `Deseja realmente remover "${employee.name}"?`,
            "Sim, remover",
            "Cancelar"
        ).then(confirmed => {
            if (confirmed) {
                dataManager.employees = dataManager.employees.filter(e => e.id !== id);
                dataManager.saveAppData();
                this.updateView();
                NotificationSystem.success("Funcionário removido com sucesso!");
            }
        });
    }

    clearForm() {
        document.getElementById("employee-form").reset();
        this.editingId = null;
    }

    /**
     * Atualiza a visualização com tabela
     */
    /**
     * Atualiza a visualização com tabela
     */
    updateView() {
        const container = document.getElementById("employees-list-container");
        if (!container) return;

        if (!dataManager.employees) dataManager.employees = [];
        const employees = dataManager.employees;

        if (employees.length === 0) {
            container.innerHTML = '<div class="no-data">Nenhum funcionário cadastrado. Preencha o formulário acima para adicionar.</div>';
            return;
        }

        let html = `
            <div style="overflow-x: auto;">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Cargo</th>
                            <th>E-mail</th>
                            <th>Telefone</th>
                            <th style="text-align: center; width: 120px;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        employees.forEach(emp => {
            const roleNames = {
                'garcom': 'Garçom',
                'caixa': 'Caixa',
                'cozinha': 'Cozinheiro',
                'gestor': 'Gestor',
                'gerente': 'Gerente'
            };

            const loginUsername = emp.email || emp.name.toLowerCase().replace(/\s+/g, '');

            html += `
                <tr>
                    <td><strong>${emp.name}</strong></td>
                    <td><span class="badge">${roleNames[emp.role] || emp.role}</span></td>
                    <td>${emp.email || '-'}</td>
                    <td>${emp.phone || '-'}</td>
                    <td style="text-align: center;">
                        <button class="btn-icon" data-id="${emp.id}" data-action="view-login" title="Ver credenciais de login">
                            🔑
                        </button>
                        <button class="btn-icon" data-id="${emp.id}" data-action="edit" title="Editar">
                            ✏️
                        </button>
                        <button class="btn-icon danger" data-id="${emp.id}" data-action="delete" title="Excluir">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;

        // Event listeners
        container.querySelectorAll('[data-action="view-login"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                this.showLoginCredentials(id);
            });
        });

        container.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                this.editEmployee(id);
            });
        });

        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                this.deleteEmployee(id);
            });
        });
    }

    /**
     * Exibe credenciais de login do funcionário
     */
    showLoginCredentials(id) {
        const employee = dataManager.employees.find(e => e.id === id);
        if (!employee) {
            NotificationSystem.error("Funcionário não encontrado!");
            return;
        }

        const loginUsername = employee.email || employee.name.toLowerCase().replace(/\s+/g, '');
        
        const message = `
            <div style="text-align: left;">
                <p><strong>Credenciais de Login:</strong></p>
                <p style="margin: 10px 0;">
                    <strong>Usuário:</strong> ${loginUsername}<br>
                    <strong>Senha:</strong> ${employee.password}
                </p>
                <p style="color: #666; font-size: 0.9rem; margin-top: 15px;">
                    💡 O funcionário pode usar seu <strong>nome</strong> ou <strong>e-mail</strong> para fazer login.
                </p>
            </div>
        `;

        NotificationSystem.show(message, "info", 8000);
    }
}

export const employeesManager = new EmployeesManager();
