// script/utils/LocalStorageHelper.js

export class LocalStorageHelper {
    static isAvailable() {
        try {
            const test = "__localStorage_test__";
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn("localStorage não disponível:", e.message);
            return false;
        }
    }

    static setItem(key, value) {
        if (!this.isAvailable()) {
            console.warn("localStorage não disponível");
            return false;
        }
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error("Erro ao salvar no localStorage:", e);
            return false;
        }
    }

    static getItem(key) {
        if (!this.isAvailable()) return null;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error("Erro ao ler do localStorage:", e);
            return null;
        }
    }

    static removeItem(key) {
        if (!this.isAvailable()) return false;
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error("Erro ao remover do localStorage:", e);
            return false;
        }
    }

    static clear() {
        if (!this.isAvailable()) return false;
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error("Erro ao limpar localStorage:", e);
            return false;
        }
    }
}