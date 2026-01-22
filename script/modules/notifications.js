// ===========================
// NOTIFICATIONS - Sistema de Notificações
// ===========================

import { escapeHtml } from '../utils/helpers.js';

/**
 * Sistema de notificações e diálogos
 */
export class NotificationSystem {
    /**
     * Mostra notificação
     */
    static show(message, type = "info", duration = 5000) {
        // Remove notificações existentes
        const existing = document.querySelectorAll(".notification");
        existing.forEach((notif) => notif.remove());

        const notification = document.createElement("div");
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${escapeHtml(message)}</span>
                <button class="notification-close" aria-label="Fechar">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        const closeBtn = notification.querySelector(".notification-close");
        closeBtn.addEventListener("click", () => notification.remove());

        // Mostra com animação
        setTimeout(() => notification.classList.add("show"), 10);

        // Remove automaticamente
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove("show");
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }

        return notification;
    }
    static alert(message, title = "Atenção", confirmText = "OK") {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.className = "notification-overlay";
    
            const dialog = document.createElement("div");
            dialog.className = "notification-dialog";
            dialog.innerHTML = `
                <div class="dialog-content">
                    ${title ? `<h4 style="margin-top: 0;">${escapeHtml(title)}</h4>` : ''}
                    <p style="white-space: pre-line;">${escapeHtml(message)}</p>
                    <div class="dialog-actions" style="justify-content: center;">
                        <button class="btn btn-primary" id="dialog-ok">
                            ${escapeHtml(confirmText)}
                        </button>
                    </div>
                </div>
            `;
    
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
    
            setTimeout(() => {
                overlay.classList.add("show");
                dialog.classList.add("show");
            }, 10);
    
            const cleanup = () => {
                overlay.classList.remove("show");
                setTimeout(() => overlay.remove(), 300);
                resolve(true);
            };
    
            document.getElementById("dialog-ok").onclick = cleanup;
            
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    cleanup();
                }
            };
            
            // Adiciona tecla Enter para fechar
            document.addEventListener('keydown', function handleKeyPress(e) {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    document.removeEventListener('keydown', handleKeyPress);
                    cleanup();
                }
            });
        });
    }
    /**
     * Mostra diálogo de confirmação
     */
    static confirm(message, confirmText = "Confirmar", cancelText = "Cancelar") {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.className = "notification-overlay";

            const dialog = document.createElement("div");
            dialog.className = "notification-dialog";
            dialog.innerHTML = `
                <div class="dialog-content">
                    <p>${escapeHtml(message)}</p>
                    <div class="dialog-actions">
                        <button class="btn btn-secondary" id="dialog-cancel">
                            ${escapeHtml(cancelText)}
                        </button>
                        <button class="btn btn-primary" id="dialog-confirm">
                            ${escapeHtml(confirmText)}
                        </button>
                    </div>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            setTimeout(() => {
                overlay.classList.add("show");
                dialog.classList.add("show");
            }, 10);

            const cleanup = () => {
                overlay.classList.remove("show");
                setTimeout(() => overlay.remove(), 300);
            };

            document.getElementById("dialog-cancel").onclick = () => {
                cleanup();
                resolve(false);
            };

            document.getElementById("dialog-confirm").onclick = () => {
                cleanup();
                resolve(true);
            };

            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(false);
                }
            };
        });
    }

    /**
     * Mostra notificação de sucesso
     */
    static success(message, duration = 5000) {
        return this.show(message, "success", duration);
    }

    /**
     * Mostra notificação de erro
     */
    static error(message, duration = 5000) {
        return this.show(message, "error", duration);
    }

    /**
     * Mostra notificação de aviso
     */
    static warning(message, duration = 5000) {
        return this.show(message, "warning", duration);
    }

    /**
     * Mostra notificação de informação
     */
    static info(message, duration = 5000) {
        return this.show(message, "info", duration);
    }

    /**
     * Mostra diálogo de prompt (input)
     */
    static prompt(message, defaultValue = "", confirmText = "OK", cancelText = "Cancelar") {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.className = "notification-overlay";

            const dialog = document.createElement("div");
            dialog.className = "notification-dialog";
            dialog.innerHTML = `
                <div class="dialog-content">
                    <p>${escapeHtml(message)}</p>
                    <input 
                        type="text" 
                        id="dialog-input" 
                        class="form-control" 
                        value="${escapeHtml(defaultValue)}"
                        style="margin: 12px 0;"
                    />
                    <div class="dialog-actions">
                        <button class="btn btn-secondary" id="dialog-cancel">
                            ${escapeHtml(cancelText)}
                        </button>
                        <button class="btn btn-primary" id="dialog-confirm">
                            ${escapeHtml(confirmText)}
                        </button>
                    </div>
                </div>
            `;

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            const input = dialog.querySelector("#dialog-input");
            
            setTimeout(() => {
                overlay.classList.add("show");
                dialog.classList.add("show");
                input.focus();
                input.select();
            }, 10);

            const cleanup = () => {
                overlay.classList.remove("show");
                setTimeout(() => overlay.remove(), 300);
            };

            const handleConfirm = () => {
                const value = input.value.trim();
                cleanup();
                resolve(value || null);
            };

            const handleCancel = () => {
                cleanup();
                resolve(null);
            };

            document.getElementById("dialog-cancel").onclick = handleCancel;
            document.getElementById("dialog-confirm").onclick = handleConfirm;

            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    handleConfirm();
                } else if (e.key === "Escape") {
                    handleCancel();
                }
            });

            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    handleCancel();
                }
            };
        });
    }

    /**
     * Mostra loading
     */
    static showLoading(message = "Carregando...") {
        const loading = document.createElement("div");
        loading.className = "notification-overlay loading-overlay";
        loading.id = "loading-overlay";
        loading.innerHTML = `
            <div class="notification-dialog">
                <div class="dialog-content" style="text-align: center;">
                    <div class="spinner"></div>
                    <p style="margin-top: 12px;">${escapeHtml(message)}</p>
                </div>
            </div>
        `;

        document.body.appendChild(loading);

        setTimeout(() => {
            loading.classList.add("show");
            loading.querySelector(".notification-dialog").classList.add("show");
        }, 10);

        return loading;
    }
    /**
     * Mostra diálogo com HTML customizado
     */
    static showHTML(htmlContent, type = "info", duration = 5000) {
        // Remove notificações existentes
        const existing = document.querySelectorAll(".notification");
        existing.forEach((notif) => notif.remove());
    
        const notification = document.createElement("div");
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${htmlContent}</span>
                <button class="notification-close" aria-label="Fechar">×</button>
            </div>
        `;
    
        document.body.appendChild(notification);
    
        const closeBtn = notification.querySelector(".notification-close");
        closeBtn.addEventListener("click", () => notification.remove());
    
        // Mostra com animação
        setTimeout(() => notification.classList.add("show"), 10);
    
        // Remove automaticamente
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove("show");
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    
        return notification;
    }
    /**
     * Esconde loading
     */
    static hideLoading() {
        const loading = document.getElementById("loading-overlay");
        if (loading) {
            loading.classList.remove("show");
            setTimeout(() => loading.remove(), 300);
        }
    }
}