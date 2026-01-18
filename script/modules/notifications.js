// script/modules/notifications.js

export class NotificationSystem {
    static show(message, type = "info", duration = 5000) {
        const existing = document.querySelectorAll(".notification");
        existing.forEach((notif) => notif.remove());

        const notification = document.createElement("div");
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${this.escapeHtml(message)}</span>
                <button class="notification-close" aria-label="Fechar">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        const closeBtn = notification.querySelector(".notification-close");
        closeBtn.addEventListener("click", () => notification.remove());

        setTimeout(() => notification.classList.add("show"), 10);

        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove("show");
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }

        return notification;
    }

    static confirm(message, confirmText = "Confirmar", cancelText = "Cancelar") {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.className = "notification-overlay";

            const dialog = document.createElement("div");
            dialog.className = "notification-dialog";
            dialog.innerHTML = `
                <div class="dialog-content">
                    <p>${this.escapeHtml(message)}</p>
                    <div class="dialog-actions">
                        <button class="btn btn-secondary" id="dialog-cancel">${this.escapeHtml(cancelText)}</button>
                        <button class="btn btn-primary" id="dialog-confirm">${this.escapeHtml(confirmText)}</button>
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

    static escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
}
