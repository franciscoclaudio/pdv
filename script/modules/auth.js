// script/modules/auth.js

import { USERS, currentUser } from '../utils/constants.js';
import { NotificationSystem } from './notifications.js';
import { DataManager } from './dataManager.js';
import { initializeSystemWithPermissions } from './navigation.js';

// Variáveis de timer (mover para aqui)
let inactivityTimer = null;
let eventListenersAdded = false;
let autoSaveInterval = null;
let lastSavedData = null;

export function initializeLogin() {
    const loginForm = document.getElementById("login-form");
    const demoButtons = document.querySelectorAll(".demo-btn");
    const logoutBtn = document.getElementById("logout-btn");

    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value;

            const errors = DataValidator.validateUserCredentials(username, password);
            if (errors.length > 0) {
                NotificationSystem.show(errors[0], "error");
                return;
            }

            authenticateUser(username, password);
        });
    }

    if (demoButtons) {
        demoButtons.forEach((btn) => {
            btn.addEventListener("click", function () {
                const username = this.getAttribute("data-user");
                const password = this.getAttribute("data-pass");

                document.getElementById("username").value = username;
                document.getElementById("password").value = password;

                authenticateUser(username, password);
            });
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
}

export function authenticateUser(username, password) {
    const user = users.find((u) => u.username === username && u.password === password);

    if (user) {
        currentUser = user;
        LocalStorageHelper.setItem("currentUser", JSON.stringify(user));
        showMainSystem();
        NotificationSystem.show(`Bem-vindo, ${user.name}!`, "success");

        setupInactivityTimer();
        startAutoSave();
    } else {
        NotificationSystem.show("Usuário ou senha inválidos!", "error");
    }
}

export function logout() {
    if (window.dropdownInitialized) window.dropdownInitialized = false;
    if (window.pdvInitialized) window.pdvInitialized = false;

    clearInactivityTimer();
    stopAutoSave();
    DataManager.saveAppData();

    currentUser = null;
    LocalStorageHelper.removeItem("currentUser");

    const mainSystem = document.getElementById("main-system");
    const loginContainer = document.getElementById("login-container");

    if (mainSystem) mainSystem.style.display = "none";
    if (loginContainer) loginContainer.style.display = "flex";

    document.body.className = "";

    const loginForm = document.getElementById("login-form");
    if (loginForm) loginForm.reset();

    currentOrder = {items: [], type: "table", tableNumber: 1, customerName: ""};

    NotificationSystem.show("Logout realizado com sucesso!", "success");
}

export function showMainSystem() {
    const loginContainer = document.getElementById("login-container");
    const mainSystem = document.getElementById("main-system");

    if (loginContainer) loginContainer.style.display = "none";
    if (mainSystem) mainSystem.style.display = "block";

    updateUserInterface();
    initializeSystemWithPermissions();
}

// Funções de timer
export function setupInactivityTimer() {
    if (eventListenersAdded) return;
    const events = ["mousemove", "keypress", "click", "scroll", "touchstart"];
    events.forEach((event) => {
        document.addEventListener(event, resetInactivityTimer, {passive: true});
    });
    eventListenersAdded = true;
    resetInactivityTimer();
}
export function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        if (currentUser) {
            NotificationSystem.show("Sessão expirada por inatividade", "warning");
            logout();
        }
    }, 30 * 60 * 1000);
}
export function clearInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
}
export function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(() => {
        if (!currentUser) return;
        const currentData = JSON.stringify({orders, mesas, products});
        if (currentData !== lastSavedData) {
            DataManager.saveAppData();
            lastSavedData = currentData;
        }
    }, 30000);
}
export function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
}