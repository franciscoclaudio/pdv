// ==========================================
// CAIXA.JS - Gerenciamento de Caixa
// ==========================================

import { dataManager } from './dataManager.js';
import { NotificationSystem } from './notifications.js';
import { authManager } from './auth.js';
import { formatCurrency, formatDateTime } from '../utils/helpers.js';

export class CaixaManager {
    constructor() {
        this.initialized = false;
        this.editingMovimentacaoId = null;
    }

    initialize() {
        if (this.initialized) return;
        this.initialized = true;
    
        this.setupEventListeners();
        this.updateView();
        
        // ✅ OUVE EVENTOS DE ATUALIZAÇÃO DO CAIXA
        document.addEventListener('caixaUpdated', () => {
            console.log('Caixa atualizado por pagamento - atualizando view...');
            this.updateView();
        });
        
        // ✅ Também ouve atualizações de pedidos que podem afetar o caixa
        document.addEventListener('ordersUpdated', () => {
            console.log('Pedidos atualizados - verificando caixa...');
            this.updateView();
        });
    }

    setupEventListeners() {
        // Botão abrir caixa
        const btnAbrirCaixa = document.getElementById("btn-abrir-caixa");
        if (btnAbrirCaixa) {
            btnAbrirCaixa.addEventListener("click", () => this.abrirCaixa());
        }

        // Botão fechar caixa
        const btnFecharCaixa = document.getElementById("btn-fechar-caixa");
        if (btnFecharCaixa) {
            btnFecharCaixa.addEventListener("click", () => this.fecharCaixa());
        }

        // Formulário de movimentação
        const formMovimentacao = document.getElementById("movimentacao-form");
        if (formMovimentacao) {
            formMovimentacao.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleMovimentacaoSubmit();
            });
        }

        // Botão cancelar movimentação
        const btnCancelarMov = document.getElementById("cancelar-movimentacao");
        if (btnCancelarMov) {
            btnCancelarMov.addEventListener("click", () => this.cancelarMovimentacao());
        }
    }

    // REMOVA ESTE MÉTODO DAQUI - Ele deve ficar no dataManager.js
    // fecharCaixaComDetalhes(dadosFechamento, responsavel) {
    //     ... código ...
    // }

    abrirCaixa() {
        if (dataManager.getStatusCaixa() === "aberto") {
            NotificationSystem.error("O caixa já está aberto!");
            return;
        }

        NotificationSystem.prompt(
            "Informe o saldo inicial do caixa:",
            "0.00",
            "Abrir Caixa",
            "Cancelar"
        ).then((saldoInicialStr) => {
            if (saldoInicialStr === null) return;

            const saldoInicial = parseFloat(saldoInicialStr.replace(",", "."));
            if (isNaN(saldoInicial) || saldoInicial < 0) {
                NotificationSystem.error("Valor inválido para saldo inicial!");
                return;
            }

            const responsavel = authManager.getCurrentUser().name;
            const sucesso = dataManager.abrirCaixa(saldoInicial, responsavel);

            if (sucesso) {
                NotificationSystem.success(`Caixa aberto com saldo inicial de ${formatCurrency(saldoInicial)}`);
                // ✅ Dispara evento de atualização
                document.dispatchEvent(new Event('caixaUpdated'));
                this.updateView();
            }
        });
    }

    fecharCaixa() {
        if (dataManager.getStatusCaixa() !== "aberto") {
            NotificationSystem.error("O caixa precisa estar aberto para ser fechado!");
            return;
        }
    
        const resumo = dataManager.getResumoCaixa();
        
        // Criar modal de fechamento com separação por forma de pagamento
        this.showFechamentoModal(resumo);
    }
    
    showFechamentoModal(resumo) {
        console.log("DEBUG: showFechamentoModal chamado");
        
        // Remover modal existente se houver
        const existingModal = document.getElementById('caixa-fechamento-modal');
        if (existingModal) existingModal.remove();
        
        // Calcular totais por forma de pagamento
        const formasPagamento = resumo.porFormaPagamento || {};
        const saldoDinheiro = (formasPagamento.cash?.total || 0) + resumo.totalEntradas - resumo.totalSaidas;
        const saldoCartao = formasPagamento.card?.total || 0;
        const saldoPix = formasPagamento.pix?.total || 0;
        const saldoVR = formasPagamento.meal_voucher?.total || 0;
        
        // Saldo calculado total
        const saldoCalculadoTotal = resumo.saldoAtual;
        
        const modal = document.createElement('div');
        modal.id = 'caixa-fechamento-modal';
        modal.className = 'modal active';
        
        // Guardar referências para uso nos event listeners
        const modalRef = modal;
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>🔴 Fechamento de Caixa</h3>
                    <span class="close" id="close-fechamento-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="resumo-geral">
                        <h4>📊 Resumo Geral</h4>
                        <div class="resumo-grid">
                            <div class="resumo-item">
                                <span>Saldo Inicial:</span>
                                <span class="valor">${formatCurrency(resumo.saldoInicial)}</span>
                            </div>
                            <div class="resumo-item">
                                <span>Total Vendas:</span>
                                <span class="valor">${formatCurrency(resumo.totalVendas)}</span>
                            </div>
                            <div class="resumo-item">
                                <span>Entradas:</span>
                                <span class="valor positivo">+ ${formatCurrency(resumo.totalEntradas)}</span>
                            </div>
                            <div class="resumo-item">
                                <span>Saídas:</span>
                                <span class="valor negativo">- ${formatCurrency(resumo.totalSaidas)}</span>
                            </div>
                            <div class="resumo-item total">
                                <span><strong>Saldo Calculado:</strong></span>
                                <span class="valor"><strong>${formatCurrency(saldoCalculadoTotal)}</strong></span>
                            </div>
                            <div class="resumo-item">
                                <span>Quantidade Pedidos:</span>
                                <span class="valor">${resumo.quantidadePedidos}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="separador"></div>
                    
                    <div class="formas-pagamento">
                        <h4>💳 Formas de Pagamento</h4>
                        <div class="formas-grid">
                            <div class="forma-item dinheiro">
                                <div class="forma-titulo">
                                    <span class="forma-icon">💰</span>
                                    <span>Dinheiro</span>
                                </div>
                                <div class="forma-valores">
                                    <div class="forma-valor">
                                        <span>Vendas:</span>
                                        <span>${formatCurrency(formasPagamento.cash?.total || 0)}</span>
                                    </div>
                                    <div class="forma-valor">
                                        <span>Movimentações:</span>
                                        <span>${formatCurrency(resumo.totalEntradas - resumo.totalSaidas)}</span>
                                    </div>
                                    <div class="forma-valor total">
                                        <span>Total Esperado:</span>
                                        <input type="number" 
                                               id="dinheiro-final" 
                                               class="forma-input" 
                                               step="0.01" 
                                               value="${saldoDinheiro.toFixed(2)}"
                                               placeholder="Digite o valor encontrado">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="forma-item cartao">
                                <div class="forma-titulo">
                                    <span class="forma-icon">💳</span>
                                    <span>Cartão</span>
                                    <span class="forma-qtd">(${formasPagamento.card?.quantidade || 0} vendas)</span>
                                </div>
                                <div class="forma-valores">
                                        <div class="forma-valor">
                                        <span>Total Vendas:</span>
                                        <span>${formatCurrency(saldoCartao)}</span>
                                    </div>
                                    <div class="forma-valor total">
                                        <span>Total Esperado:</span>
                                        <span class="valor-fixo">${formatCurrency(saldoCartao)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="forma-item pix">
                                <div class="forma-titulo">
                                    <span class="forma-icon">📱</span>
                                    <span>PIX</span>
                                    <span class="forma-qtd">(${formasPagamento.pix?.quantidade || 0} vendas)</span>
                                </div>
                                <div class="forma-valores">
                                    <div class="forma-valor">
                                        <span>Total Vendas:</span>
                                        <span>${formatCurrency(saldoPix)}</span>
                                    </div>
                                    <div class="forma-valor total">
                                        <span>Total Esperado:</span>
                                        <span class="valor-fixo">${formatCurrency(saldoPix)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="forma-item vr">
                                <div class="forma-titulo">
                                    <span class="forma-icon">🍴</span>
                                    <span>Vale Refeição</span>
                                    <span class="forma-qtd">(${formasPagamento.meal_voucher?.quantidade || 0} vendas)</span>
                                </div>
                                <div class="forma-valores">
                                    <div class="forma-valor">
                                        <span>Total Vendas:</span>
                                        <span>${formatCurrency(saldoVR)}</span>
                                    </div>
                                    <div class="forma-valor total">
                                        <span>Total Esperado:</span>
                                        <span class="valor-fixo">${formatCurrency(saldoVR)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="separador"></div>
                    
                    <div class="resumo-final">
                        <div class="total-geral">
                            <div class="total-item">
                                <span>Total Calculado:</span>
                                <span id="total-calculado">${formatCurrency(saldoCalculadoTotal)}</span>
                            </div>
                            <div class="total-item">
                                <span>Total Informado:</span>
                                <span id="total-informado">${formatCurrency(saldoDinheiro + saldoCartao + saldoPix + saldoVR)}</span>
                            </div>
                            <div class="total-item diferenca" id="diferenca-container">
                                <span>Diferença:</span>
                                <span id="diferenca-valor">R$ 0,00</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="cancelar-fechamento-btn">
                        Cancelar
                    </button>
                    <button type="button" class="btn btn-primary" id="confirmar-fechamento-btn">
                        ✅ Confirmar Fechamento
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Configurar cálculo automático da diferença
        const dinheiroInput = document.getElementById('dinheiro-final');
        const totalInformadoEl = document.getElementById('total-informado');
        const diferencaValorEl = document.getElementById('diferenca-valor');
        const diferencaContainer = document.getElementById('diferenca-container');
        
        const calcularDiferenca = () => {
            const dinheiroFinal = parseFloat(dinheiroInput.value) || 0;
            const totalInformado = dinheiroFinal + saldoCartao + saldoPix + saldoVR;
            const diferenca = totalInformado - saldoCalculadoTotal;
            
            // Atualizar total informado
            if (totalInformadoEl) {
                totalInformadoEl.textContent = formatCurrency(totalInformado);
            }
            
            // Atualizar diferença
            if (diferencaValorEl) {
                diferencaValorEl.textContent = formatCurrency(Math.abs(diferenca));
                
                // Colorir conforme resultado
                if (diferencaContainer) {
                    if (Math.abs(diferenca) < 0.01) {
                        diferencaContainer.className = 'total-item diferenca zero';
                        diferencaValorEl.innerHTML = `✅ R$ 0,00`;
                    } else if (diferenca > 0) {
                        diferencaContainer.className = 'total-item diferenca positiva';
                        diferencaValorEl.innerHTML = `▲ +${formatCurrency(diferenca)}`;
                    } else {
                        diferencaContainer.className = 'total-item diferenca negativa';
                        diferencaValorEl.innerHTML = `▼ -${formatCurrency(Math.abs(diferenca))}`;
                    }
                }
            }
        };
        
        // Event listener para input de dinheiro
        if (dinheiroInput) {
            dinheiroInput.addEventListener('input', calcularDiferenca);
            // Calcular diferença inicial
            calcularDiferenca();
        }
        
        // Configurar eventos dos botões
        const setupEventListeners = () => {
            const closeBtn = document.getElementById('close-fechamento-modal');
            const cancelBtn = document.getElementById('cancelar-fechamento-btn');
            const confirmBtn = document.getElementById('confirmar-fechamento-btn');
            
            // Função para fechar modal
            const fecharModal = () => {
                console.log("DEBUG: Fechando modal...");
                if (modalRef && modalRef.parentNode) {
                    modalRef.classList.remove('active');
                    setTimeout(() => {
                        if (modalRef.parentNode) {
                            modalRef.parentNode.removeChild(modalRef);
                        }
                    }, 300);
                }
            };
            
            // Botão fechar (X)
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    fecharModal();
                });
            }
            
            // Botão cancelar
            if (cancelBtn) {
                cancelBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    fecharModal();
                });
            }
            
            // Botão confirmar - CORREÇÃO CRÍTICA AQUI!
            if (confirmBtn) {
                confirmBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log("DEBUG: Botão confirmar clicado!");
                    
                    if (!dinheiroInput) {
                        NotificationSystem.error("Campo de dinheiro não encontrado!");
                        return;
                    }
                    
                    const dinheiroFinal = parseFloat(dinheiroInput.value);
                    
                    if (isNaN(dinheiroFinal)) {
                        NotificationSystem.error("Digite um valor válido para o dinheiro!");
                        dinheiroInput.focus();
                        return;
                    }
                    
                    if (dinheiroFinal < 0) {
                        NotificationSystem.error("O valor do dinheiro não pode ser negativo!");
                        dinheiroInput.focus();
                        return;
                    }
                    
                    // Preparar dados do fechamento
                    const dadosFechamento = {
                        saldoFinalDinheiro: dinheiroFinal,
                        saldoCartao: saldoCartao,
                        saldoPix: saldoPix,
                        saldoVR: saldoVR,
                        totalInformado: dinheiroFinal + saldoCartao + saldoPix + saldoVR,
                        totalCalculado: saldoCalculadoTotal,
                        diferenca: (dinheiroFinal + saldoCartao + saldoPix + saldoVR) - saldoCalculadoTotal
                    };
                    
                    console.log("DEBUG: Dados do fechamento:", dadosFechamento);
                    
                    // Verificar se temos o método necessário no dataManager
                    const responsavel = authManager.getCurrentUser()?.name || "Usuário";
                    let sucesso = false;
                    
                    // ✅ CORREÇÃO: Usar método temporário se não existir
                    if (typeof dataManager.fecharCaixa === 'function') {
                        console.log("DEBUG: Usando fecharCaixa");
                        // Chama o método existente passando o total informado
                        sucesso = dataManager.fecharCaixa(dadosFechamento.totalInformado, responsavel);
                        
                        // Se deu certo, salva os detalhes extras
                        if (sucesso && dataManager.caixa) {
                            dataManager.caixa.detalhesFechamento = {
                                ...dadosFechamento,
                                dataFechamento: new Date().toISOString(),
                                responsavel: responsavel
                            };
                            dataManager.saveAppData();
                        }
                    } else {
                        console.error("DEBUG: Método fecharCaixa não encontrado!");
                        NotificationSystem.error("Erro no sistema de caixa!");
                        return;
                    }
                    
                    if (sucesso) {
                        // Gerar relatório
                        if (typeof this.gerarRelatorioFechamentoDetalhado === 'function') {
                            this.gerarRelatorioFechamentoDetalhado(resumo, dadosFechamento);
                        }
                        
                        NotificationSystem.success("Caixa fechado com sucesso!");
                        
                        // Dispara evento de atualização
                        document.dispatchEvent(new Event('caixaUpdated'));
                        
                        // Atualizar view
                        this.updateView();
                        
                        // Fechar modal
                        fecharModal();
                    } else {
                        NotificationSystem.error("Erro ao fechar o caixa!");
                    }
                });
            }
            
            // Fechar modal ao clicar fora
            modalRef.addEventListener('click', (e) => {
                if (e.target === modalRef) {
                    fecharModal();
                }
            });
            
            // Prevenir fechamento ao clicar dentro do modal-content
            const modalContent = modalRef.querySelector('.modal-content');
            if (modalContent) {
                modalContent.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
        };
        
        // Aguardar um pouco para garantir que o DOM foi renderizado
        setTimeout(setupEventListeners, 50);
    }
    
    // Método antigo de relatório (mantido para compatibilidade)
    gerarRelatorioFechamento(resumo, saldoFinal) {
        const diferenca = saldoFinal - resumo.saldoAtual;
        let relatorio = `RELATÓRIO DE FECHAMENTO DE CAIXA\n`;
        relatorio += `================================\n`;
        relatorio += `Data/Hora: ${formatDateTime(new Date())}\n`;
        relatorio += `Responsável: ${authManager.getCurrentUser().name}\n\n`;
        
        relatorio += `RESUMO:\n`;
        relatorio += `Saldo Inicial: ${formatCurrency(resumo.saldoInicial)}\n`;
        relatorio += `Total de Vendas: ${formatCurrency(resumo.totalVendas)}\n`;
        relatorio += `Quantidade de Pedidos: ${resumo.quantidadePedidos}\n`;
        relatorio += `Entradas Adicionais: ${formatCurrency(resumo.totalEntradas)}\n`;
        relatorio += `Saídas: ${formatCurrency(resumo.totalSaidas)}\n`;
        relatorio += `Saldo Esperado: ${formatCurrency(resumo.saldoAtual)}\n`;
        relatorio += `Saldo Encontrado: ${formatCurrency(saldoFinal)}\n`;
        
        if (diferenca !== 0) {
            relatorio += `DIFERENÇA: ${formatCurrency(diferenca)} (${diferenca > 0 ? "SOBRA" : "FALTA"})\n`;
        } else {
            relatorio += `DIFERENÇA: ZERADA ✓\n`;
        }
        
        relatorio += `\nFORMA DE PAGAMENTO:\n`;
        if (resumo.porFormaPagamento) {
            Object.entries(resumo.porFormaPagamento).forEach(([forma, dados]) => {
                relatorio += `${dados.nome || forma}: ${formatCurrency(dados.total)} (${dados.quantidade} pedidos)\n`;
            });
        }

        // Cria um blob com o relatório
        const blob = new Blob([relatorio], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        
        const dataAtual = new Date().toISOString().split("T")[0];
        a.href = url;
        a.download = `relatorio_caixa_${dataAtual}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    gerarRelatorioFechamentoDetalhado(resumo, dadosFechamento) {
        let relatorio = `RELATÓRIO DE FECHAMENTO DE CAIXA - DETALHADO\n`;
        relatorio += `================================================\n`;
        relatorio += `Data/Hora: ${formatDateTime(new Date())}\n`;
        relatorio += `Responsável: ${authManager.getCurrentUser().name}\n\n`;
        
        relatorio += `RESUMO GERAL:\n`;
        relatorio += `Saldo Inicial: ${formatCurrency(resumo.saldoInicial)}\n`;
        relatorio += `Total de Vendas: ${formatCurrency(resumo.totalVendas)}\n`;
        relatorio += `Quantidade de Pedidos: ${resumo.quantidadePedidos}\n`;
        relatorio += `Entradas Adicionais: ${formatCurrency(resumo.totalEntradas)}\n`;
        relatorio += `Saídas: ${formatCurrency(resumo.totalSaidas)}\n`;
        relatorio += `Saldo Calculado Total: ${formatCurrency(resumo.saldoAtual)}\n\n`;
        
        relatorio += `DETALHAMENTO POR FORMA DE PAGAMENTO:\n`;
        relatorio += `----------------------------------------\n`;
        
        Object.entries(resumo.porFormaPagamento || {}).forEach(([forma, dados]) => {
            if (dados.total > 0) {
                relatorio += `${dados.nome || forma}: ${formatCurrency(dados.total)} (${dados.quantidade} pedidos)\n`;
            }
        });
        
        relatorio += `\nSALDOS INFORMAÇÕES:\n`;
        relatorio += `Dinheiro Informado: ${formatCurrency(dadosFechamento.saldoFinalDinheiro)}\n`;
        relatorio += `Cartão: ${formatCurrency(dadosFechamento.saldoCartao)}\n`;
        relatorio += `PIX: ${formatCurrency(dadosFechamento.saldoPix)}\n`;
        relatorio += `Vale Refeição: ${formatCurrency(dadosFechamento.saldoVR)}\n`;
        relatorio += `Total Informado: ${formatCurrency(dadosFechamento.totalInformado)}\n\n`;
        
        relatorio += `RESULTADO:\n`;
        relatorio += `Total Calculado: ${formatCurrency(dadosFechamento.totalCalculado)}\n`;
        relatorio += `Total Informado: ${formatCurrency(dadosFechamento.totalInformado)}\n`;
        
        if (Math.abs(dadosFechamento.diferenca) < 0.01) {
            relatorio += `DIFERENÇA: ZERADA ✓\n`;
        } else if (dadosFechamento.diferenca > 0) {
            relatorio += `SOBRA: ${formatCurrency(dadosFechamento.diferenca)}\n`;
        } else {
            relatorio += `FALTA: ${formatCurrency(Math.abs(dadosFechamento.diferenca))}\n`;
        }
        
        // Cria e faz download do relatório
        const blob = new Blob([relatorio], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        
        const dataAtual = new Date().toISOString().split("T")[0];
        a.href = url;
        a.download = `relatorio_caixa_detalhado_${dataAtual}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    handleMovimentacaoSubmit() {
        if (dataManager.getStatusCaixa() !== "aberto") {
            NotificationSystem.error("O caixa precisa estar aberto para realizar movimentações!");
            return;
        }

        const tipo = document.getElementById("movimentacao-tipo").value;
        const valor = parseFloat(document.getElementById("movimentacao-valor").value);
        const descricao = document.getElementById("movimentacao-descricao").value.trim();
        
        if (!tipo || !valor || valor <= 0) {
            NotificationSystem.error("Preencha todos os campos corretamente!");
            return;
        }

        if (!descricao) {
            NotificationSystem.error("Informe uma descrição para a movimentação!");
            return;
        }

        const responsavel = authManager.getCurrentUser().name;
        
        dataManager.adicionarMovimentacao(tipo, valor, descricao, responsavel);
        NotificationSystem.success(`Movimentação de ${formatCurrency(valor)} registrada!`);
        
        document.getElementById("movimentacao-form").reset();
        this.updateView();
    }

    cancelarMovimentacao() {
        document.getElementById("movimentacao-form").reset();
        this.editingMovimentacaoId = null;
    }

    excluirMovimentacao(id) {
        NotificationSystem.confirm(
            "Deseja realmente excluir esta movimentação?",
            "Excluir",
            "Cancelar"
        ).then((confirmado) => {
            if (confirmado) {
                dataManager.caixa.movimentacoes = dataManager.caixa.movimentacoes.filter(m => m.id !== id);
                dataManager.saveAppData();
                this.updateView();
                NotificationSystem.success("Movimentação excluída!");
            }
        });
    }

    updateView() {
        const container = document.getElementById("caixa-container");
        if (!container) return;

        const status = dataManager.getStatusCaixa();
        const resumo = dataManager.getResumoCaixa();

        let html = `
            <div class="caixa-status-card ${status}">
                <h3>Status do Caixa: <span class="status-badge">${status === "aberto" ? "🟢 ABERTO" : "🔴 FECHADO"}</span></h3>
                
                ${status === "aberto" && dataManager.caixa.abertura ? `
                    <p>Aberto por: <strong>${dataManager.caixa.responsavelAbertura}</strong></p>
                    <p>Data/Hora Abertura: <strong>${formatDateTime(new Date(dataManager.caixa.abertura))}</strong></p>
                ` : ''}
                
                ${status === "fechado" && dataManager.caixa.fechamento ? `
                    <p>Fechado por: <strong>${dataManager.caixa.responsavelFechamento}</strong></p>
                    <p>Data/Hora Fechamento: <strong>${formatDateTime(new Date(dataManager.caixa.fechamento))}</strong></p>
                ` : ''}
            </div>

            <div class="caixa-resumo-cards">
                <div class="resumo-card">
                    <h4>Saldo Inicial</h4>
                    <div class="valor">${formatCurrency(resumo.saldoInicial)}</div>
                </div>
                <div class="resumo-card">
                    <h4>Total Vendas</h4>
                    <div class="valor">${formatCurrency(resumo.totalVendas)}</div>
                </div>
                <div class="resumo-card">
                    <h4>Saldo Atual</h4>
                    <div class="valor">${formatCurrency(resumo.saldoAtual)}</div>
                </div>
                <div class="resumo-card">
                    <h4>Pedidos</h4>
                    <div class="valor">${resumo.quantidadePedidos}</div>
                </div>
            </div>
        `;

        // Botões de ação
        html += `
            <div class="caixa-actions">
                ${status === "fechado" ? `
                    <button class="btn btn-success" id="btn-abrir-caixa">
                        🟢 Abrir Caixa
                    </button>
                ` : `
                    <button class="btn btn-danger" id="btn-fechar-caixa">
                        🔴 Fechar Caixa
                    </button>
                `}
            </div>
        `;

        // Formulário de movimentação (apenas se caixa aberto)
        if (status === "aberto") {
            html += `
                <div class="form-card">
                    <h4>Nova Movimentação</h4>
                    <form id="movimentacao-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="movimentacao-tipo">Tipo</label>
                                <select id="movimentacao-tipo" class="form-control" required>
                                    <option value="">Selecione...</option>
                                    <option value="entrada">Entrada</option>
                                    <option value="saída">Saída</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="movimentacao-valor">Valor (R$)</label>
                                <input type="number" id="movimentacao-valor" class="form-control" step="0.01" min="0.01" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="movimentacao-descricao">Descrição</label>
                            <input type="text" id="movimentacao-descricao" class="form-control" placeholder="Ex: Troco, Sangria, Despesa, etc." required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="cancelar-movimentacao">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Registrar Movimentação</button>
                        </div>
                    </form>
                </div>
            `;
        }

        // Lista de movimentações (se houver)
        if (dataManager.caixa.movimentacoes && dataManager.caixa.movimentacoes.length > 0) {
            html += `
                <div class="movimentacoes-list">
                    <h4>Movimentações do Caixa</h4>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Data/Hora</th>
                                    <th>Tipo</th>
                                    <th>Descrição</th>
                                    <th>Valor</th>
                                    <th>Responsável</th>
                                    <th style="width: 80px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            // Ordena por data (mais recente primeiro)
            const movimentacoesOrdenadas = [...dataManager.caixa.movimentacoes].sort((a, b) => 
                new Date(b.data) - new Date(a.data)
            );

            movimentacoesOrdenadas.forEach(mov => {
                const tipoClass = mov.tipo === "entrada" ? "entrada" : "saida";
                html += `
                    <tr>
                        <td>${formatDateTime(new Date(mov.data))}</td>
                        <td><span class="badge ${tipoClass}">${mov.tipo.toUpperCase()}</span></td>
                        <td>${mov.descricao}</td>
                        <td class="${tipoClass}">${mov.tipo === "entrada" ? "+" : "-"} ${formatCurrency(mov.valor)}</td>
                        <td>${mov.responsavel}</td>
                        <td>
                            <button class="btn-icon danger" data-id="${mov.id}" data-action="excluir-movimentacao" title="Excluir">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        // Reconfigura event listeners
        this.setupEventListeners();

        // Configura listeners para excluir movimentações
        container.querySelectorAll('[data-action="excluir-movimentacao"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                this.excluirMovimentacao(id);
            });
        });
    }
}

export const caixaManager = new CaixaManager();