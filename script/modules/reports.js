// ===========================
// REPORTS - Relatórios (Versão completa com carregador dinâmico html2pdf)
// ===========================

import { dataManager } from './dataManager.js';
import { NotificationSystem } from './notifications.js';
import { formatCurrency, filterOrdersByDate } from '../utils/helpers.js';
import { validateReportPeriod } from '../utils/validators.js';

/**
 * Utilitário: garante que html2pdf esteja carregado (faz load dinâmico se necessário)
 * Retorna a promise que resolve quando window.html2pdf estiver disponível.
 */
function ensureHtml2Pdf(timeout = 10000) {
    return new Promise((resolve, reject) => {
        if (typeof window.html2pdf !== 'undefined') {
            return resolve(window.html2pdf);
        }

        // Se já existe um <script> com essa src em carregamento, aguarda seus eventos
        const existing = Array.from(document.getElementsByTagName('script'))
            .find(s => s.src && s.src.includes('html2pdf.bundle.min.js'));
        if (existing) {
            existing.addEventListener('load', () => {
                if (typeof window.html2pdf !== 'undefined') resolve(window.html2pdf);
                else reject(new Error('html2pdf carregado, mas window.html2pdf indefinido'));
            });
            existing.addEventListener('error', () => reject(new Error('Erro ao carregar html2pdf')));
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js';
        script.async = true;
        script.onload = () => {
            if (typeof window.html2pdf !== 'undefined') {
                resolve(window.html2pdf);
            } else {
                reject(new Error('html2pdf carregado, mas window.html2pdf indefinido'));
            }
        };
        script.onerror = () => reject(new Error('Falha ao carregar html2pdf (network / CORS / CSP)'));
        document.head.appendChild(script);

        // timeout de segurança
        setTimeout(() => reject(new Error('Timeout ao carregar html2pdf')), timeout);
    });
}

/**
 * Gerenciador de relatórios
 */
export class ReportsManager {
    constructor() {
        this.initialized = false;
    }

    /**
     * Inicializa módulo de relatórios
     */
    initialize() {
        if (this.initialized) return;
        this.initialized = true;

        this.setupEventListeners();
        this.updateSummaryDisplay();
        // Atualiza os resumos quando os dados são importados/alterados
        document.addEventListener('dataImported', () => {
            this.updateSummaryDisplay();
        });
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        const generateBtn = document.getElementById("generate-report");
        const exportBtn = document.getElementById("export-report");
        const periodSelect = document.getElementById("report-period");
        const exportBackupBtn = document.getElementById("export-backup");
        const importBackupBtn = document.getElementById("import-backup");
        const backupFileInput = document.getElementById("backup-file");

        // Botões rápidos (nova UI)
        const btnDaily = document.getElementById("btn-daily");
        const btnMonthly = document.getElementById("btn-monthly");
        const btnWeekly = document.getElementById("btn-weekly");
        const btnCardTotal = document.getElementById("btn-card-total");
        const btnCashTotal = document.getElementById("btn-cash-total");
        const btnPixTotal = document.getElementById("btn-pix-total");

        if (generateBtn) {
            generateBtn.addEventListener("click", () => this.generateReport());
        }

        if (exportBtn) {
            exportBtn.addEventListener("click", () => this.exportReport());
        }

        if (periodSelect) {
            periodSelect.addEventListener("change", (e) => {
                this.toggleCustomDateInputs(e.target.value === "custom");
            });
        }

        if (exportBackupBtn) {
            exportBackupBtn.addEventListener("click", () => {
                dataManager.exportData();
            });
        }

        if (importBackupBtn) {
            importBackupBtn.addEventListener('click', () => {
                if (backupFileInput) backupFileInput.click();
            });
        }

        if (backupFileInput) {
            backupFileInput.addEventListener("change", (e) => {
                if (e.target.files.length > 0) {
                    dataManager.importData(e.target.files[0], () => {
                        // Callback de sucesso - atualiza todas as views
                        document.dispatchEvent(new Event('dataImported'));
                    });
                    e.target.value = "";
                }
            });
        }

        // Ativa botões rápidos (se existirem)
        if (btnDaily) btnDaily.addEventListener('click', () => this.triggerQuickReport({ period: 'today', label: 'Vendas Diárias' }));
        if (btnWeekly) btnWeekly.addEventListener('click', () => this.triggerQuickReport({ period: 'week', label: 'Vendas Semanais' }));
        if (btnMonthly) btnMonthly.addEventListener('click', () => this.triggerQuickReport({ period: 'month', label: 'Vendas Mensais' }));

        if (btnCardTotal) btnCardTotal.addEventListener('click', () => this.triggerQuickReport({ period: 'all', paymentMethod: 'card', label: 'Total Cartão' }));
        if (btnCashTotal) btnCashTotal.addEventListener('click', () => this.triggerQuickReport({ period: 'all', paymentMethod: 'cash', label: 'Total Dinheiro' }));
        if (btnPixTotal) btnPixTotal.addEventListener('click', () => this.triggerQuickReport({ period: 'all', paymentMethod: 'pix', label: 'Total PIX' }));
    }

    /**
     * Alterna inputs de data customizada
     */
    toggleCustomDateInputs(show) {
        const customDatesGroup = document.getElementById("custom-dates-group");
        const customDatesGroupEnd = document.getElementById("custom-dates-group-end");

        if (customDatesGroup) {
            customDatesGroup.style.display = show ? "block" : "none";
        }

        if (customDatesGroupEnd) {
            customDatesGroupEnd.style.display = show ? "block" : "none";
        }
    }

    /**
     * Atualiza os cards de resumo (total caixa + meios de pagamento) e desenha sparklines
     */
    updateSummaryDisplay() {
        const orders = Array.isArray(dataManager.orders) ? dataManager.orders : [];
        const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);

        // Agrupa por método de pagamento (tenta mapear variações)
        const totalsByMethod = { cash: 0, card: 0, pix: 0, other: 0 };
        orders.forEach(o => {
            const method = (o.paymentMethod || '').toString().toLowerCase();
            const value = o.total || 0;
            if (/pix/.test(method)) {
                totalsByMethod.pix += value;
            } else if (/cash|dinheiro|money/.test(method)) {
                totalsByMethod.cash += value;
            } else if (/card|cartao|credito|debito|cc|card /.test(method)) {
                totalsByMethod.card += value;
            } else {
                totalsByMethod.other += value;
            }
        });

        const elTotal = document.getElementById('summary-total');
        const elCash = document.getElementById('summary-cash');
        const elCard = document.getElementById('summary-card');
        const elPix  = document.getElementById('summary-pix');

        if (elTotal) elTotal.textContent = formatCurrency(totalSales);
        if (elCash) elCash.textContent = formatCurrency(totalsByMethod.cash);
        if (elCard) elCard.textContent = formatCurrency(totalsByMethod.card);
        if (elPix)  elPix.textContent  = formatCurrency(totalsByMethod.pix);

        // Desenha sparklines (últimos 7 dias)
        const last7Totals = this.aggregateLastNDays(orders, 7);
        const last7Cash   = this.aggregateLastNDays(orders.filter(o => /cash|dinheiro|money/.test((o.paymentMethod||'').toLowerCase())), 7);
        const last7Card   = this.aggregateLastNDays(orders.filter(o => /card|cartao|credito|debito|cc|card /.test((o.paymentMethod||'').toLowerCase())), 7);
        const last7Pix    = this.aggregateLastNDays(orders.filter(o => /pix/.test((o.paymentMethod||'').toLowerCase())), 7);

        this.drawSparkline('spark-total', last7Totals, '#af3a3a');
        this.drawSparkline('spark-cash', last7Cash, '#27ae60');
        this.drawSparkline('spark-card', last7Card, '#1e62ff');
        this.drawSparkline('spark-pix', last7Pix, '#8b2cff');
    }

    /**
     * Agrega valores por dia (últimos N dias) e retorna array com N valores (0 se não houver)
     */
    aggregateLastNDays(orders, n = 7) {
        const days = [];
        const today = new Date();
        // cria mapa data => total
        const map = {};
        orders.forEach(o => {
            const d = new Date(o.createdAt || o.updatedAt || Date.now());
            // normaliza para YYYY-MM-DD
            const key = d.toISOString().slice(0,10);
            map[key] = (map[key] || 0) + (o.total || 0);
        });

        for (let i = n - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const key = d.toISOString().slice(0,10);
            days.push(map[key] || 0);
        }
        return days;
    }

    /**
     * Desenha sparkline em canvas simples
     */
    drawSparkline(canvasId, data = [], color = '#333') {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !canvas.getContext) return;
        const ctx = canvas.getContext('2d');
        const DPR = window.devicePixelRatio || 1;
        const width = canvas.width;
        const height = canvas.height;
        // support high DPI
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.width = width * DPR;
        canvas.height = height * DPR;
        ctx.scale(DPR, DPR);

        // clear
        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) return;

        const padding = 4;
        const w = width - padding * 2;
        const h = height - padding * 2;
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        // points
        const points = data.map((v, i) => {
            const x = padding + (i / (data.length - 1 || 1)) * w;
            const y = padding + h - ((v - min) / range) * h;
            return {x, y, v};
        });

        // filled area
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length-1].x, height - padding);
        ctx.lineTo(points[0].x, height - padding);
        ctx.closePath();
        ctx.fillStyle = this.hexToRgba(color, 0.08);
        ctx.fill();

        // line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();

        // last dot
        const last = points[points.length - 1];
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Converte hex para rgba
     */
    hexToRgba(hex, a = 1) {
        // aceita formatos #rgb, #rrggbb
        let c = hex.replace('#','');
        if (c.length === 3) c = c.split('').map(ch => ch+ch).join('');
        const bigint = parseInt(c, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    /**
     * Gera relatório (usado pela UI padrão de filtros)
     */
    generateReport() {
        const period = document.getElementById("report-period")?.value || "today";
        const reportType = document.getElementById("report-type")?.value || "sales";
        const startDate = document.getElementById("date-start")?.value;
        const endDate = document.getElementById("date-end")?.value;

        // Valida período
        const validationErrors = validateReportPeriod(period, startDate, endDate);
        if (validationErrors.length > 0) {
            NotificationSystem.error(validationErrors[0]);
            return;
        }

        const resultsContainer = document.getElementById("report-results-container");
        if (!resultsContainer) return;

        let filteredOrders = [];

        if (period === "custom" && startDate && endDate) {
            filteredOrders = dataManager.orders.filter(o => {
                const orderDate = new Date(o.createdAt);
                return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
            });
        } else {
            filteredOrders = filterOrdersByDate(dataManager.orders, period);
        }

        const reportHtml = this.generateReportHtml(
            filteredOrders, 
            reportType, 
            this.getPeriodLabel(period)
        );

        resultsContainer.innerHTML = reportHtml;

        // show single PDF export control
        this.showPdfOnlyControl({
            label: `Relatório (${this.getPeriodLabel(period)} - ${reportType})`,
            data: {
                generatedAt: new Date().toISOString(),
                period,
                reportType,
                orders: filteredOrders
            }
        });

        NotificationSystem.success("Relatório gerado com sucesso!");
    }

    /**
     * Gera HTML do relatório
     */
    generateReportHtml(orders, type, periodLabel) {
        const totalOrders = orders.length;
        const paidOrders = orders.filter(o => o.paymentStatus === "paid" || o.paymentStatus === "closed");
        const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const totalPaid = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        let html = `
            <div class="report-summary card">
                <h4>Relatório de ${type === "sales" ? "Vendas" : type === "products" ? "Produtos" : "Tempo de Atendimento"}</h4>
                <p><strong>Período:</strong> ${periodLabel}</p>
                <p><strong>Total de Pedidos:</strong> ${totalOrders}</p>
                <p><strong>Pedidos Pagos:</strong> ${paidOrders.length}</p>
                <p><strong>Faturamento Total:</strong> ${formatCurrency(totalSales)}</p>
                <p><strong>Recebido:</strong> ${formatCurrency(totalPaid)}</p>
                <p><strong>Pendente:</strong> ${formatCurrency(totalSales - totalPaid)}</p>
            </div>
        `;

        if (type === "sales") {
            html += this.generateSalesDetails(orders);
        } else if (type === "products") {
            html += this.generateProductsDetails(orders);
        } else if (type === "time") {
            html += this.generateTimeDetails(orders);
        }

        return html;
    }

    /**
     * Gera detalhes de vendas
     */
    generateSalesDetails(orders) {
        const paymentMethods = {};

        orders.forEach(o => {
            if (o.paymentMethod) {
                const key = o.paymentMethod;
                if (!paymentMethods[key]) {
                    paymentMethods[key] = { count: 0, total: 0 };
                }
                paymentMethods[key].count++;
                paymentMethods[key].total += o.total || 0;
            }
        });

        let html = '<div class="report-details card" style="margin-top:12px"><h5>Vendas por Método de Pagamento</h5><ul>';
        
        for (const [method, data] of Object.entries(paymentMethods)) {
            html += `<li>${method}: ${data.count} pedidos - ${formatCurrency(data.total)}</li>`;
        }
        
        html += '</ul></div>';
        
        return html;
    }

    /**
     * Gera detalhes de produtos
     */
    generateProductsDetails(orders) {
        const products = {};

        orders.forEach(order => {
            (order.items || []).forEach(item => {
                if (!products[item.name]) {
                    products[item.name] = { quantity: 0, revenue: 0 };
                }
                products[item.name].quantity += item.quantity;
                products[item.name].revenue += item.price * item.quantity;
            });
        });

        const sortedProducts = Object.entries(products)
            .sort((a, b) => b[1].quantity - a[1].quantity)
            .slice(0, 10);

        let html = '<div class="report-details card" style="margin-top:12px"><h5>Top 10 Produtos Mais Vendidos</h5><ul>';
        
        sortedProducts.forEach(([name, data]) => {
            html += `<li>${name}: ${data.quantity} unidades - ${formatCurrency(data.revenue)}</li>`;
        });
        
        html += '</ul></div>';
        
        return html;
    }

    /**
     * Gera detalhes de tempo
     */
    generateTimeDetails(orders) {
        const completedOrders = orders.filter(o => 
            o.status === "delivered" || o.paymentStatus === "paid"
        );

        if (completedOrders.length === 0) {
            return '<div class="report-details card" style="margin-top:12px"><p>Nenhum pedido concluído no período.</p></div>';
        }

        const times = completedOrders
            .filter(o => o.createdAt && o.updatedAt)
            .map(o => {
                const start = new Date(o.createdAt);
                const end = new Date(o.updatedAt);
                return (end - start) / (1000 * 60); // minutos
            });

        if (times.length === 0) {
            return '<div class="report-details card" style="margin-top:12px"><p>Dados de tempo insuficientes.</p></div>';
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        return `
            <div class="report-details card" style="margin-top:12px">
                <h5>Tempo de Atendimento</h5>
                <ul>
                    <li>Tempo Médio: ${avgTime.toFixed(1)} minutos</li>
                    <li>Tempo Mínimo: ${minTime.toFixed(1)} minutos</li>
                    <li>Tempo Máximo: ${maxTime.toFixed(1)} minutos</li>
                </ul>
            </div>
        `;
    }

    /**
     * Mostra apenas 1 controle: Exportar PDF (bonito)
     */
    showPdfOnlyControl({ label = 'Relatório', data = {} } = {}) {
        const controls = document.getElementById("report-results-controls");
        if (!controls) return;
        controls.style.display = 'flex';
        controls.innerHTML = '';

        const btnPdf = document.createElement('button');
        btnPdf.className = 'btn-export';
        btnPdf.textContent = 'Exportar PDF';
        btnPdf.addEventListener('click', async () => {
            const resultsContainer = document.getElementById("report-results-container");
            const html = resultsContainer ? resultsContainer.innerHTML : '';
            await this.exportPdf(html, `${label.replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.pdf`, data);
        });

        controls.appendChild(btnPdf);
    }

    /**
     * Gera relatórios rápidos (botões) — pode filtrar por período e/ou método de pagamento
     * options: { period: 'today'|'week'|'month'|'all', paymentMethod?: 'cash'|'card'|'pix', label?: string }
     */
    triggerQuickReport(options = {}) {
        const resultsContainer = document.getElementById("report-results-container");
        const controls = document.getElementById("report-results-controls");
        if (!resultsContainer) return;

        let orders = Array.isArray(dataManager.orders) ? dataManager.orders.slice() : [];

        // filtra por período
        if (options.period && options.period !== 'all') {
            orders = filterOrdersByDate(orders, options.period);
        }

        // filtra por método se informado
        if (options.paymentMethod) {
            const method = options.paymentMethod.toLowerCase();
            orders = orders.filter(o => {
                const pm = (o.paymentMethod || '').toString().toLowerCase();
                if (method === 'pix') return /pix/.test(pm);
                if (method === 'cash') return /cash|dinheiro|money/.test(pm);
                if (method === 'card') return /card|cartao|credito|debito|cc|card /.test(pm);
                return pm === method || pm.includes(method);
            });
        }

        // Constrói HTML simples de resultado
        const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0);
        const totalOrders = orders.length;

        let html = `<div class="card report-quick card">
            <h4>${options.label || 'Relatório Rápido'}</h4>
            <p><strong>Período:</strong> ${this.getPeriodLabel(options.period || 'all')}</p>
            <p><strong>Total de Pedidos:</strong> ${totalOrders}</p>
            <p><strong>Faturamento Total:</strong> ${formatCurrency(totalSales)}</p>
        </div>`;

        // Se quiser, adiciona detalhe por método
        if (!options.paymentMethod && totalOrders > 0) {
            html += this.generateSalesDetails(orders);
        }

        // monta objeto de dados do relatório para export
        const reportData = {
            generatedAt: new Date().toISOString(),
            label: options.label || 'Relatório Rápido',
            period: options.period || 'all',
            paymentMethod: options.paymentMethod || null,
            totalOrders,
            totalSales,
            orders
        };

        resultsContainer.innerHTML = html;

        // mostra apenas botão Exportar PDF
        if (controls) {
            controls.style.display = 'flex';
            controls.innerHTML = ''; // limpa

            const btnPdf = document.createElement('button');
            btnPdf.className = 'btn-export';
            btnPdf.textContent = 'Exportar PDF';
            btnPdf.addEventListener('click', async () => {
                await this.exportPdf(resultsContainer.innerHTML, `relatorio_rapido_${(options.label||'relatorio').replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.pdf`, reportData);
            });

            controls.appendChild(btnPdf);
        }

        NotificationSystem.success("Relatório gerado com sucesso!");
    }

    /**
     * Exporta HTML para PDF "bonito" usando html2pdf
     * - reportHtml: string com o conteúdo (normalmente innerHTML do container)
     * - filename: nome do arquivo final
     * - metaData: objeto opcional com informações (ex.: label, generatedAt)
     */
    async exportPdf(reportHtml, filename = 'relatorio.pdf', metaData = {}) {
        // Garante que html2pdf esteja carregado (dinamic load se necessário)
        try {
            await ensureHtml2Pdf();
        } catch (err) {
            console.error('Erro ao carregar html2pdf:', err);
            NotificationSystem.error('Não foi possível carregar a biblioteca de PDF. Verifique sua conexão ou as políticas de carregamento (CSP/SRI).');
            return;
        }

        // Verifica se html2pdf está disponível
        if (typeof window.html2pdf === 'undefined') {
            NotificationSystem.error('Biblioteca html2pdf.js não encontrada após tentativa de carregamento.');
            return;
        }

        // Prepara wrapper com cabeçalho (logo / título / data)
        const wrapper = document.createElement('div');
        wrapper.className = 'pdf-export-wrapper';

        // Cabeçalho
        const header = document.createElement('div');
        header.className = 'pdf-header';

        // tenta obter a logomarca carregada (preview)
        const previewImg = document.getElementById('imagemCarregada');
        let logoSrc = null;
        if (previewImg && previewImg.src && previewImg.style.display !== 'none') {
            logoSrc = previewImg.src;
        }

        if (logoSrc) {
            const img = document.createElement('img');
            img.className = 'pdf-logo';
            img.src = logoSrc;
            img.alt = 'Logo';
            header.appendChild(img);
        } else {
            // placeholder com texto da marca
            const placeholder = document.createElement('div');
            placeholder.style.width = '86px';
            placeholder.style.height = '86px';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.background = '#fff';
            placeholder.style.borderRadius = '8px';
            placeholder.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)';
            placeholder.style.fontWeight = 800;
            placeholder.style.color = '#af3a3a';
            placeholder.textContent = document.querySelector('.logo h1')?.textContent?.trim() || 'SUA MARCA';
            header.appendChild(placeholder);
        }

        // Título e meta
        const titleWrap = document.createElement('div');
        titleWrap.className = 'pdf-title';
        const title = document.createElement('h2');
        title.textContent = metaData.label || 'Relatório';
        const meta = document.createElement('div');
        meta.className = 'pdf-meta';
        const dateLabel = new Date().toLocaleString();
        meta.textContent = `Gerado em: ${metaData.generatedAt ? new Date(metaData.generatedAt).toLocaleString() : dateLabel}`;

        titleWrap.appendChild(title);
        titleWrap.appendChild(meta);
        header.appendChild(titleWrap);

        wrapper.appendChild(header);

        // conteúdo do relatório (mantemos o HTML passado)
        const content = document.createElement('div');
        content.className = 'pdf-content';
        content.innerHTML = reportHtml;
        wrapper.appendChild(content);

        // Adiciona temporariamente ao DOM (necessário para html2pdf medir estilos)
        wrapper.style.maxWidth = '1100px';
        wrapper.style.margin = '10px auto';
        wrapper.style.background = '#f7f8fa';
        wrapper.style.padding = '18px';
        wrapper.style.boxSizing = 'border-box';
        wrapper.setAttribute('data-generated-by', 'reportsManager');

        document.body.appendChild(wrapper);

        // Configurações do html2pdf (ajustáveis)
        const opt = {
            margin: [12, 12, 12, 12], // mm (top/right/bottom/left)
            filename: filename,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, allowTaint: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
            // html2pdf retorna promise
            await window.html2pdf().set(opt).from(wrapper).save();

            NotificationSystem.success('PDF exportado com sucesso!');
        } catch (err) {
            console.error('Erro ao exportar PDF:', err);
            NotificationSystem.error('Falha ao gerar PDF.');
        } finally {
            // remove wrapper temporário
            setTimeout(() => {
                if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
            }, 600);
        }
    }

    /**
     * Faz download de JSON
     * (mantido caso precise futuramente, mas não é exposto na UI atualmente)
     */
    downloadJson(obj, filename = 'relatorio.json') {
        const dataStr = JSON.stringify(obj, null, 2);
        const blob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Abre janela para impressão (útil para salvar em PDF)
     * (mantido, não exposto por padrão)
     */
    printReport(htmlContent, title = 'Relatório') {
        const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
        if (!w) {
            NotificationSystem.error('Não foi possível abrir a janela de impressão (bloqueador de popups?).');
            return;
        }
        w.document.write(`
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body{font-family: Arial, Helvetica, sans-serif; padding:20px; color:#222}
                    .card{background:#fff;border:1px solid #ddd;padding:12px;border-radius:8px;margin-bottom:10px}
                    h4{margin:4px 0 8px 0}
                    ul{margin:8px 0 12px 20px}
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `);
        w.document.close();
        // aguarda render
        setTimeout(() => {
            w.focus();
            w.print();
        }, 300);
    }

    /**
     * Obtém label do período
     */
    getPeriodLabel(period) {
        const labels = {
            today: "Hoje",
            yesterday: "Ontem",
            week: "Últimos 7 dias",
            month: "Último mês",
            all: "Todos os períodos",
            custom: "Personalizado"
        };
        return labels[period] || period;
    }
}

// Exporta instância singleton
export const reportsManager = new ReportsManager();