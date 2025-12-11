// Removido código solto fora da classe. O método renderEsteiraLegend deve estar dentro da classe ClientManager.
// Removido obj.openEsteiraModal antigo para evitar conflito de escopo e erro de sintaxe

// ============================================================================
// SISTEMA DE GERENCIAMENTO DE CLIENTES - JAVASCRIPT VANILLA
// ============================================================================

/**
 * Definições de tipos de cliente
 */
const clientTypes = {
    school: 'Escola',
    network: 'Rede de Ensino',
    public: 'Escola Pública',
    university: 'Universidade',
    course: 'Curso Técnico'
};

// Mapa de colunas visuais (header) -> campos reais no objeto cliente
const columnFieldMap = {
    name: 'nome',
    type: 'tipo',
    phone: 'telefone',
    cnpj: 'cnpj',
    city: 'cidade',
    state: 'uf',
    vendedor: 'vendedor_responsavel'
};

class ClientManager {
    constructor() {
        console.log('🚀 ClientManager inicializado');
        this.clients = [];
        this.filteredClients = [];
        this.vendedores = []; // Lista de vendedores para dropdown
        this.currentPage = 1;
        this.itemsPerPage = 25;
        this.sortColumn = 'nome';
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.stateFilter = '';
        this.cityFilter = '';
        this.microregionFilter = '';
        this.typeFilter = '';
        this.isLoading = false;
        this.pagination = null;
        this.apiAvailable = false;
        
        console.log('📋 Estado inicial:', {
            clients: this.clients.length,
            filteredClients: this.filteredClients.length,
            searchTerm: this.searchTerm
        });
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeLucideIcons();
        // A inicialização dos dados agora é chamada após a verificação de autenticação
    }

    renderPagination() {
            if (!this.paginationSection) return;
            const totalPages = this.getTotalPages();
            this.paginationSection.style.display = totalPages > 1 ? 'flex' : 'none';
            this.paginationInfo.textContent = `Página ${this.currentPage} de ${totalPages}`;
            this.firstPageBtn.disabled = this.currentPage === 1;
            this.prevPageBtn.disabled = this.currentPage === 1;
            this.nextPageBtn.disabled = this.currentPage === totalPages;
            this.lastPageBtn.disabled = this.currentPage === totalPages;
            this.perPageSelect.value = this.itemsPerPage;
        }

    /**
     * Renderiza a barra de etapas do funil/esteira para o cliente selecionado
     */
    renderEsteiraLegend(selectedClient) {
        console.log('🎨 renderEsteiraLegend chamado para:', selectedClient?.nome);
        
        const ESTEIRA_CONFIG = [
            { id: 'prospeccao', color: '#90EE90', label: '1 - Prospecção 3 Canais' },
            { id: 'aumentar_conexao', color: '#90EE90', label: '2 - Aumentar Conexão' },
            { id: 'envio_consultor', color: '#FFB366', label: '3 - Envio de Consultor' },
            { id: 'efetivacao', color: '#87CEEB', label: '4 - Efetivação' },
            { id: 'registros_legais', color: '#87CEEB', label: '5 - Registros Legais' },
            { id: 'separacao', color: '#D3D3D3', label: '6 - Separação' },
            { id: 'entrega', color: '#D3D3D3', label: '7 - Entrega' },
            { id: 'recebimentos', color: '#FFFF99', label: '8 - Recebimentos' },
            { id: 'formacao', color: '#FFCC99', label: '9 - Formação' },
            { id: 'documentarios', color: '#FFCC99', label: '10 - Documentários' },
            { id: 'gerar_graficos', color: '#FFCC99', label: '11 - Gerar Gráficos' },
            { id: 'renovacao', color: '#FFCC99', label: '12 - Renovação' }
        ];
        const legendDiv = document.getElementById('esteira-legend');
        if (!legendDiv) {
            console.error('❌ esteira-legend não encontrado no DOM');
            return;
        }
        console.log('✅ esteira-legend encontrado');
        legendDiv.innerHTML = ESTEIRA_CONFIG.map((etapa, index) => {
            // Calcula o progresso baseado nas tarefas concluídas de cada etapa
            let isActive = false;
            let isCompleted = false;
            
            if (selectedClient && selectedClient.tarefas_concluidas) {
                const tarefasDaEtapa = selectedClient.tarefas_concluidas[etapa.id] || [];
                const progressoEtapa = Array.isArray(tarefasDaEtapa) ? tarefasDaEtapa.length : 0;
                
                // Considera ativo se tem algum progresso
                isActive = progressoEtapa > 0;
                
                // Considera completo se tem 3 ou mais tarefas (assumindo máximo de 5 tarefas por etapa)
                isCompleted = progressoEtapa >= 3;
            }
            
            return `
                <div class="esteira-etapa-col" style="display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;min-width:60px;" data-etapa="${etapa.id}" data-color="${etapa.color}">
                    <span style="width:16px;height:16px;border-radius:50%;background:${isCompleted ? etapa.color : (isActive ? etapa.color : '#f5f5f5')};display:inline-block;border:${isCompleted ? '2px solid ' + etapa.color : (isActive ? '2px solid ' + etapa.color : '1px solid #ccc')};opacity:${isCompleted ? 1 : (isActive ? 0.7 : 0.4)};"></span>
                    <span style="font-size:10px;font-weight:${isCompleted ? 'bold' : 'normal'};color:${isCompleted ? '#222' : (isActive ? '#555' : '#999')};text-align:center;line-height:1.2;">${etapa.label}</span>
                </div>
            `;
        }).join('');
        // Adiciona evento de clique nas bolinhas para selecionar etapa
        legendDiv.querySelectorAll('.esteira-etapa-col').forEach(col => {
            col.addEventListener('click', () => {
                const etapaId = col.getAttribute('data-etapa');
                if (selectedClient) {
                    selectedClient.status = etapaId;
                    this.renderEsteiraLegend(selectedClient);
                    this.renderTable();
                }
            });
        });
        // Renderiza a tabela completa da esteira na inicialização
        if (selectedClient) {
            console.log('📋 Chamando renderEsteiraProcessosTableInTableContainer...');
            this.renderEsteiraProcessosTableInTableContainer(selectedClient);
        } else {
            console.warn('⚠️ selectedClient não definido, não é possível renderizar tabela');
        }
    }

    // Renderiza a tabela do funil/esteira na section separada acima da tabela de clientes
    renderEsteiraProcessosTableInTableContainer(selectedClient) {
        console.log('📊 renderEsteiraProcessosTableInTableContainer iniciado');
        console.log('👤 Cliente:', selectedClient?.nome);
        console.log('✅ Tarefas concluídas:', selectedClient?.tarefas_concluidas);
        
        const processosSection = document.getElementById('esteiraProcessosSection');
        const processosDiv = document.getElementById('esteira-processos');
        
        console.log('🔍 Elementos encontrados:', { 
            processosSection: !!processosSection, 
            processosDiv: !!processosDiv 
        });
        
        if (!processosSection || !processosDiv) {
            console.warn('⚠️ Elementos da esteira não encontrados:', { processosSection, processosDiv });
            return;
        }
        
        // Torna a seção visível
        processosSection.style.display = 'block';
        console.log('✅ Seção tornada visível');
        
        // Remove tabela anterior se existir
        let oldTable = document.getElementById('esteira-processos-tabela');
        if (oldTable) {
            console.log('🗑️ Removendo tabela anterior');
            oldTable.remove();
        }
        
        // Estrutura completa da matriz de processos baseada no Excel
        const etapas = [
            { id: 'prospeccao', nome: '1 - PROSPECÇÃO 3 CANAIS', tipo: 'PROSPECÇÃO' },
            { id: 'aumentar_conexao', nome: '2- AUMENTAR CONEXÃO', tipo: 'PROSPECÇÃO' },
            { id: 'envio_consultor', nome: '3 - ENVIO DE CONSULTOR', tipo: 'REPRESENTANTE OU DISTRIB' },
            { id: 'efetivacao', nome: '4 - EFETIVAÇÃO', tipo: 'DIRETOR' },
            { id: 'registros_legais', nome: '5 - REGISTROS LEGAIS', tipo: 'DIRETOR' },
            { id: 'separacao', nome: '6 - SEPARAÇÃO', tipo: 'LOGÍSTICA' },
            { id: 'entrega', nome: '7 - ENTREGA', tipo: 'LOGÍSTICA' },
            { id: 'recebimentos', nome: '8- RECEBIMENTOS', tipo: 'FINANCEIRO' },
            { id: 'formacao', nome: '9 - FORMAÇÃO', tipo: 'FORMADORES' },
            { id: 'documentarios', nome: '10- DOCUMENTÁRIOS', tipo: 'MARKETING' },
            { id: 'gerar_graficos', nome: '11 - GERAR GRÁFICOS', tipo: 'TECNOGIA E GERENCIA DADOS' },
            { id: 'renovacao', nome: '12 - RENOVAÇÃO DE RELACIONAMENTO', tipo: 'PROSPECÇÃO' }
        ];
        
        const acoes = [
            {
                label: 'AÇÃO 1',
                values: [
                    'Apresentar projeto- email',
                    'responde contatos c/ link video anexado',
                    'Apresentação técnica c/material',
                    'Envia proposta + document',
                    'assina contrato',
                    'separa material',
                    'Realiza entrega(Foto)',
                    'Acompanha pagamento',
                    'Agenda formação',
                    'coleta imagens e entrevista',
                    'Medir indices e validação',
                    'APRESENTAR RELATÓRIOS E CONQUISTAS'
                ]
            },
            {
                label: 'AÇÃO 2',
                values: [
                    'Apresentação projeto - video Watsapp',
                    'liga e agenda reunião consultor',
                    'Coleta de parecer',
                    'Acompanha publicação',
                    'registra publicação',
                    'envia material',
                    'documenta entrega(Foto)',
                    'cobra pagamento',
                    'Realiza formação',
                    'gera video',
                    'pesquisas satisfação/DIVERSAS',
                    'ENVIAR CERTIFICADOS'
                ]
            },
            {
                label: 'AÇÃO 3',
                values: [
                    'Apresentação projeto por ligação',
                    'Relembra reunião e envio video anexado',
                    'atualiza números alunos/email',
                    'Emite NF',
                    'Emite NF',
                    'informa envio (foto)',
                    '',
                    'baixa de titulo',
                    'Entrega certificado',
                    'publica video',
                    'Criar e alimentar publicar relatórios',
                    'recomeçar propecção outra coleção'
                ]
            },
            {
                label: 'AÇÃO 4',
                values: [
                    '',
                    '',
                    'negocia fornecimento/data/prod.',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    'cadastrar para premiações',
                    '',
                    ''
                ]
            },
            {
                label: '',
                values: [
                    'alimenta sistema',
                    'alimenta sistema',
                    'Alimentar sistema',
                    'Alimentar sistema',
                    'Alimentar sistema',
                    'Alimentar sistema',
                    'Alimentar sistema',
                    'Alimentar sistema',
                    'Alimentar sistema',
                    'Alimentar sistema',
                    'Alimentar sistema',
                    'Alimentar sistema'
                ]
            }
        ];
        
        // Inicializa estrutura de tarefas concluídas se não existir
        if (!selectedClient.tarefas_concluidas) {
            selectedClient.tarefas_concluidas = {};
        }
        
        // Garante que cada etapa tem um array para as ações
        etapas.forEach(etapa => {
            if (!selectedClient.tarefas_concluidas[etapa.id]) {
                selectedClient.tarefas_concluidas[etapa.id] = [];
            }
        });
        
        const div = document.createElement('div');
        div.id = 'esteira-processos-tabela';
        div.style.margin = 'clamp(16px, 3vw, 32px) 0 clamp(12px, 2.5vw, 24px) 0';
        div.style.overflowX = 'auto';
        div.style.width = '100%';
        div.style.webkitOverflowScrolling = 'touch'; // Smooth scrolling on iOS
        
        // Calcula estatísticas de progresso
        const totalTarefas = etapas.length * acoes.length;
        const tarefasConcluidas = Object.values(selectedClient.tarefas_concluidas || {}).reduce((sum, arr) => sum + arr.length, 0);
        const percentualGeral = totalTarefas > 0 ? ((tarefasConcluidas / totalTarefas) * 100).toFixed(1) : 0;
        
        // Calcula progresso por etapa
        const progressoPorEtapa = etapas.map(etapa => {
            const tarefasDaEtapa = selectedClient.tarefas_concluidas[etapa.id] || [];
            const percentual = (tarefasDaEtapa.length / acoes.length * 100).toFixed(0);
            return { nome: etapa.nome, percentual, cor: etapa.tipo };
        });
        
        // Cria o cabeçalho com as etapas e seus tipos
        let headerHTML = `
            <div style="min-width:1200px;width:max-content;">
                <!-- Dashboard de Progresso -->
                <div style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);padding:clamp(12px, 2vw, 20px);margin-bottom:clamp(8px, 1.5vw, 16px);border-radius:12px;box-shadow:0 4px 12px rgba(102,126,234,0.3);">
                    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
                        <div style="flex:1;min-width:250px;">
                            <h3 style="color:white;font-size:clamp(14px, 2.2vw, 18px);margin-bottom:8px;font-weight:600;">
                                📊 Progresso: ${selectedClient.nome}
                            </h3>
                            <div style="background:rgba(255,255,255,0.2);border-radius:8px;height:clamp(20px, 3vw, 28px);overflow:hidden;position:relative;">
                                <div class="dashboard-barra-progresso" style="background:linear-gradient(90deg, #10b981 0%, #34d399 100%);height:100%;width:${percentualGeral}%;transition:width 0.6s ease;box-shadow:0 2px 8px rgba(16,185,129,0.4);"></div>
                                <span class="dashboard-texto-progresso" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-weight:bold;font-size:clamp(10px, 1.6vw, 13px);text-shadow:0 1px 3px rgba(0,0,0,0.3);">
                                    ${percentualGeral}% (${tarefasConcluidas}/${totalTarefas} tarefas)
                                </span>
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;flex:1;">
                            ${progressoPorEtapa.slice(0, 6).map((p, idx) => `
                                <div class="dashboard-card-${idx}" style="background:rgba(255,255,255,0.15);padding:clamp(4px, 0.8vw, 8px);border-radius:6px;text-align:center;backdrop-filter:blur(10px);">
                                    <div style="font-size:clamp(8px, 1.3vw, 10px);color:rgba(255,255,255,0.9);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${p.nome}">${p.nome}</div>
                                    <div class="card-percentual" style="font-size:clamp(11px, 1.8vw, 14px);color:white;font-weight:bold;">${p.percentual}%</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Botões de Filtros e Histórico -->
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:clamp(8px, 1.5vw, 16px);gap:12px;flex-wrap:wrap;">
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button class="filtro-btn" data-filtro="todas" style="background:#667eea;color:white;border:none;padding:clamp(6px, 1.2vw, 10px) clamp(12px, 2vw, 18px);border-radius:6px;cursor:pointer;font-size:clamp(11px, 1.8vw, 14px);font-weight:600;transition:all 0.3s ease;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
                            ✅ Todas
                        </button>
                        <button class="filtro-btn" data-filtro="pendentes" style="background:#f59e0b;color:white;border:none;padding:clamp(6px, 1.2vw, 10px) clamp(12px, 2vw, 18px);border-radius:6px;cursor:pointer;font-size:clamp(11px, 1.8vw, 14px);font-weight:600;transition:all 0.3s ease;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
                            ⏳ Pendentes
                        </button>
                        <button class="filtro-btn" data-filtro="concluidas" style="background:#10b981;color:white;border:none;padding:clamp(6px, 1.2vw, 10px) clamp(12px, 2vw, 18px);border-radius:6px;cursor:pointer;font-size:clamp(11px, 1.8vw, 14px);font-weight:600;transition:all 0.3s ease;box-shadow:0 2px 6px rgba(0,0,0,0.1);">
                            ✔️ Concluídas
                        </button>
                    </div>
                    <button id="btn-historico" data-cliente-id="${selectedClient.id}" style="background:linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);color:white;border:none;padding:clamp(6px, 1.2vw, 10px) clamp(12px, 2vw, 18px);border-radius:6px;cursor:pointer;font-size:clamp(11px, 1.8vw, 14px);font-weight:600;transition:all 0.3s ease;box-shadow:0 2px 8px rgba(139,92,246,0.3);display:flex;align-items:center;gap:6px;">
                        📜 Histórico de Alterações
                    </button>
                </div>
                
                <div style="background:#ffff00;text-align:center;font-weight:bold;padding:clamp(6px, 1.2vw, 8px);margin-bottom:clamp(2px, 0.5vw, 4px);font-size:clamp(12px, 2vw, 16px);">
                    ESTEIRA DE : PROSPECÇÃO/ VENDA/ ENTREGA/ FORMAÇÃO/ MARKETING
                </div>
                <div style="background:#f0f9ff;padding:clamp(4px, 0.8vw, 6px);margin-bottom:clamp(4px, 0.8vw, 6px);font-size:clamp(9px, 1.5vw, 11px);color:#0369a1;text-align:center;border:1px solid #bae6fd;border-radius:4px;">
                    💡 Clique nas células para marcar/desmarcar tarefas. Você pode selecionar múltiplas ações simultaneamente.
                </div>
                <table class="client-table esteira-table-responsive" style="border-collapse:collapse;min-width:1200px;width:100%;">
                    <thead>
                        <tr>
                            <th rowspan="2" style="text-align:center;background:#f8fafc;padding:10px 8px;vertical-align:middle;border:1px solid #ccc;font-size:clamp(10px, 1.8vw, 13px);">ETAPA</th>
                            ${etapas.map(etapa => {
                                const bgColor = etapa.tipo === 'PROSPECÇÃO' ? '#ffff00' : 
                                               etapa.tipo === 'REPRESENTANTE OU DISTRIB' ? '#ff9966' :
                                               etapa.tipo === 'DIRETOR' ? '#00ccff' :
                                               etapa.tipo === 'LOGÍSTICA' ? '#cccccc' :
                                               etapa.tipo === 'FINANCEIRO' ? '#ffff00' :
                                               etapa.tipo === 'FORMADORES' ? '#ffcc99' :
                                               etapa.tipo === 'MARKETING' ? '#99ff99' :
                                               etapa.tipo === 'TECNOGIA E GERENCIA DADOS' ? '#ccccff' : '#fff';
                                return `<th style="text-align:center;background:${bgColor};padding:clamp(4px, 1vw, 8px);border:1px solid #888;font-size:clamp(9px, 1.5vw, 11px);min-width:100px;">${etapa.nome}</th>`;
                            }).join('')}
                        </tr>
                        <tr>
                            ${etapas.map(etapa => {
                                const bgColor = etapa.tipo === 'PROSPECÇÃO' ? '#ffff00' : 
                                               etapa.tipo === 'REPRESENTANTE OU DISTRIB' ? '#ff9966' :
                                               etapa.tipo === 'DIRETOR' ? '#00ccff' :
                                               etapa.tipo === 'LOGÍSTICA' ? '#cccccc' :
                                               etapa.tipo === 'FINANCEIRO' ? '#ffff00' :
                                               etapa.tipo === 'FORMADORES' ? '#ffcc99' :
                                               etapa.tipo === 'MARKETING' ? '#99ff99' :
                                               etapa.tipo === 'TECNOGIA E GERENCIA DADOS' ? '#ccccff' : '#fff';
                                return `<th style="text-align:center;background:${bgColor};padding:clamp(4px, 1vw, 6px);border:1px solid #888;font-size:clamp(8px, 1.4vw, 10px);font-weight:normal;">${etapa.tipo}</th>`;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody>`;
        
        // Cria as linhas de ações
        acoes.forEach((acao, acaoIdx) => {
            headerHTML += `<tr>`;
            headerHTML += `<td style="padding:clamp(6px, 1.2vw, 8px) clamp(4px, 1vw, 6px);font-weight:${acao.label?'bold':'normal'};background:#f3f4f6;border:1px solid #ccc;text-align:center;font-size:clamp(9px, 1.6vw, 12px);">${acao.label}</td>`;
            
            acao.values.forEach((val, etapaIdx) => {
                const etapaId = etapas[etapaIdx].id;
                const isConcluida = selectedClient.tarefas_concluidas[etapaId] && 
                                   selectedClient.tarefas_concluidas[etapaId].includes(acaoIdx);
                const bgColor = isConcluida ? '#90EE90' : '#fff';
                const cursorStyle = val && val.trim() ? 'pointer' : 'default';
                
                headerHTML += `<td 
                    style="text-align:center;padding:clamp(6px, 1.2vw, 8px) clamp(4px, 1vw, 6px);border:1px solid #ddd;vertical-align:middle;background:${bgColor};cursor:${cursorStyle};transition:background 0.2s, transform 0.1s;font-size:clamp(8px, 1.4vw, 11px);user-select:none;-webkit-tap-highlight-color:rgba(0,0,0,0.1);"
                    data-etapa-id="${etapaId}"
                    data-acao-idx="${acaoIdx}"
                    data-cliente-id="${selectedClient.id}"
                    class="tarefa-cell ${isConcluida ? 'concluida' : ''}"
                    ${val && val.trim() ? 'role="button" tabindex="0" aria-pressed="' + isConcluida + '"' : ''}
                    onmouseover="if(this.style.cursor==='pointer') this.style.background='#e0e0e0';"
                    onmouseout="this.style.background='${bgColor}';"
                >${val || '-'}</td>`;
            });
            
            headerHTML += `</tr>`;
        });
        
        // Linhas adicionais: objetivo, responsável, equipes
        headerHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        div.innerHTML = headerHTML;
        console.log('✅ HTML da tabela gerado, tamanho:', headerHTML.length);
        
        // Insere a tabela dentro do div de processos
        const processosDivTarget = document.getElementById('esteira-processos');
        if (processosDivTarget) {
            console.log('📍 Inserindo tabela no DOM...');
            processosDivTarget.innerHTML = "";
            processosDivTarget.appendChild(div);
            console.log('✅ Tabela inserida com sucesso!');
        } else {
            console.error('❌ processosDivTarget não encontrado!');
        }
        
        // Adiciona event listeners para marcar/desmarcar tarefas (suporta múltiplas seleções)
        const self = this; // Captura referência do contexto da classe
        div.querySelectorAll('.tarefa-cell').forEach(cell => {
            if (cell.textContent.trim() !== '-' && cell.textContent.trim() !== '') {
                // Suporte para touch em dispositivos móveis
                cell.style.touchAction = 'manipulation';
                
                const handleToggle = async (e) => {
                    e.preventDefault(); // Previne zoom duplo no mobile
                    
                    const etapaId = cell.getAttribute('data-etapa-id');
                    const acaoIdx = parseInt(cell.getAttribute('data-acao-idx'));
                    const clienteId = cell.getAttribute('data-cliente-id');
                    
                    // ===== VERIFICAÇÃO DE LIBERAÇÃO DE ETAPA =====
                    // Administrador (perfil_id = 1) pode avançar livremente
                    // Outros perfis precisam verificar se a etapa está liberada
                    if (!authManager.isAdmin()) {
                        // Verificar se o usuário tem acesso a esta etapa
                        const acessoLiberado = await authManager.verificarAcessoEtapa(etapaId, clienteId);
                        
                        if (!acessoLiberado) {
                            // Array de IDs das etapas na ordem correta
                            const etapasOrdem = [
                                'prospeccao', 'aumentar_conexao', 'envio_consultor', 'efetivacao',
                                'registros_legais', 'separacao', 'entrega', 'recebimentos',
                                'formacao', 'documentarios', 'gerar_graficos', 'renovacao'
                            ];
                            const idxEtapaAtual = etapasOrdem.indexOf(etapaId);
                            const etapaAnterior = idxEtapaAtual > 0 ? etapasOrdem[idxEtapaAtual - 1] : null;
                            
                            // Labels legíveis das etapas
                            const etapasLabels = {
                                'prospeccao': '1 - Prospecção 3 Canais',
                                'aumentar_conexao': '2 - Aumentar Conexão',
                                'envio_consultor': '3 - Envio de Consultor',
                                'efetivacao': '4 - Efetivação',
                                'registros_legais': '5 - Registros Legais',
                                'separacao': '6 - Separação',
                                'entrega': '7 - Entrega',
                                'recebimentos': '8 - Recebimentos',
                                'formacao': '9 - Formação',
                                'documentarios': '10 - Documentários',
                                'gerar_graficos': '11 - Gerar Gráficos',
                                'renovacao': '12 - Renovação'
                            };
                            
                            const nomeEtapaAtual = etapasLabels[etapaId] || etapaId;
                            const nomeEtapaAnterior = etapaAnterior ? (etapasLabels[etapaAnterior] || etapaAnterior) : 'anterior';
                            
                            self.showToast('warning', `⚠️ Etapa "${nomeEtapaAtual}" bloqueada. Complete primeiro a etapa "${nomeEtapaAnterior}" ou solicite liberação.`);
                            
                            // Perguntar se deseja solicitar liberação
                            const confirmar = confirm(`A etapa "${nomeEtapaAtual}" está bloqueada.\n\nVocê precisa concluir a etapa "${nomeEtapaAnterior}" primeiro, ou um administrador pode liberar o acesso.\n\nDeseja solicitar liberação para esta etapa?`);
                            
                            if (confirmar) {
                                try {
                                    await authManager.solicitarLiberacao(clienteId, etapaAnterior || 'inicio', etapaId);
                                    self.showToast('success', '✅ Solicitação de liberação enviada! Aguarde aprovação de um administrador.');
                                } catch (error) {
                                    console.error('Erro ao solicitar liberação:', error);
                                    self.showToast('error', 'Erro ao enviar solicitação. Tente novamente.');
                                }
                            }
                            
                            return; // Bloqueia a ação
                        }
                    }
                    // ===== FIM DA VERIFICAÇÃO =====
                    
                    // Toggle tarefa concluída (permite múltiplas seleções)
                    if (!selectedClient.tarefas_concluidas[etapaId]) {
                        selectedClient.tarefas_concluidas[etapaId] = [];
                    }
                    
                    const idx = selectedClient.tarefas_concluidas[etapaId].indexOf(acaoIdx);
                    const foiMarcada = idx === -1; // true se está marcando, false se está desmarcando
                    
                    if (idx > -1) {
                        // Remove esta tarefa específica
                        selectedClient.tarefas_concluidas[etapaId].splice(idx, 1);
                        cell.style.background = '#fff';
                        cell.classList.remove('concluida');
                        cell.setAttribute('aria-pressed', 'false');
                    } else {
                        // Adiciona esta tarefa sem remover outras
                        selectedClient.tarefas_concluidas[etapaId].push(acaoIdx);
                        cell.style.background = '#90EE90';
                        cell.classList.add('concluida');
                        cell.setAttribute('aria-pressed', 'true');
                    }
                    
                    // Feedback visual para mobile
                    cell.style.transform = 'scale(0.95)';
                    setTimeout(() => { cell.style.transform = 'scale(1)'; }, 100);
                    
                    // Atualiza o dashboard de progresso
                    self.atualizarDashboardProgresso(selectedClient);
                    
                    // Salva no backend
                    try {
                        const clienteAtualizado = await self.salvarTarefasCliente(clienteId, selectedClient.tarefas_concluidas);
                        console.log('✅ Tarefas salvas com sucesso');
                        console.log('🎯 Status atualizado:', clienteAtualizado.status);
                        console.log('👤 Vendedor atribuído:', clienteAtualizado.vendedor_responsavel);
                        
                        // Atualiza o status e vendedor do cliente local
                        if (clienteAtualizado && clienteAtualizado.status) {
                            selectedClient.status = clienteAtualizado.status;
                            selectedClient.vendedor_responsavel = clienteAtualizado.vendedor_responsavel;
                            // Removido: vendedor_responsavel_id (campo ainda não existe no banco)
                            
                            // Atualiza também na lista de clientes em memória
                            const clienteIdNum = parseInt(clienteId, 10);
                            if (self.clientes && Array.isArray(self.clientes)) {
                                const clienteNaLista = self.clientes.find(c => c.id === clienteIdNum);
                                if (clienteNaLista) {
                                    clienteNaLista.status = clienteAtualizado.status;
                                    clienteNaLista.vendedor_responsavel = clienteAtualizado.vendedor_responsavel;
                                    // Removido: vendedor_responsavel_id
                                }
                            }
                            
                            // Re-renderiza a legenda (bolinhas) para refletir o novo status
                            self.renderEsteiraLegend(selectedClient);
                            
                            console.log('🔄 Antes de renderTable - Vendedor do cliente:', selectedClient.vendedor_responsavel);
                            
                            // Re-renderiza a tabela de clientes para mostrar o badge do vendedor
                            self.renderTable();
                            
                            console.log('✅ UI atualizada - Status:', clienteAtualizado.status, '- Vendedor:', clienteAtualizado.vendedor_responsavel || 'Sem Vendedor');
                            
                            // Mostra toast se o vendedor foi atribuído (CORRIGIDO: selectedClient ao invés de cliente)
                            const vendedorAnterior = selectedClient.vendedor_responsavel;
                            if (clienteAtualizado.vendedor_responsavel && !vendedorAnterior) {
                                self.showToast('success', `✅ Você foi atribuído como vendedor responsável de ${selectedClient.nome}!`);
                            }
                        }
                        
                        // Registra no histórico (audit log)
                        // Pega o texto real da célula clicada (valor específico da ação)
                        const nomeAcao = cell.textContent.trim() || `Ação ${acaoIdx + 1}`;
                        await self.registrarHistorico(clienteId, etapaId, acaoIdx, nomeAcao, foiMarcada ? 'marcada' : 'desmarcada');
                    } catch (error) {
                        console.error('❌ Erro ao salvar tarefas:', error);
                        self.showToast('error', 'Erro ao salvar tarefa. Tente novamente.');
                    }
                };
                
                // Event listener para click/touch
                cell.addEventListener('click', handleToggle);
                
                // Event listener para teclado (acessibilidade)
                cell.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleToggle(e);
                    }
                });
            }
        });
        
        // Event listeners para botões de filtro
        this.configurarFiltros(selectedClient);
        
        // Event listener para botão de histórico
        this.configurarBotaoHistorico(selectedClient);
    }
    
    // Configura os botões de filtro
    configurarFiltros(selectedClient) {
        const btnsFiltro = document.querySelectorAll('.filtro-btn');
        let filtroAtivo = 'todas';
        
        btnsFiltro.forEach(btn => {
            // Destaca o botão ativo
            if (btn.getAttribute('data-filtro') === filtroAtivo) {
                btn.style.opacity = '1';
                btn.style.transform = 'scale(1.05)';
            } else {
                btn.style.opacity = '0.7';
                btn.style.transform = 'scale(1)';
            }
            
            btn.addEventListener('click', () => {
                filtroAtivo = btn.getAttribute('data-filtro');
                
                // Atualiza visual dos botões
                btnsFiltro.forEach(b => {
                    if (b.getAttribute('data-filtro') === filtroAtivo) {
                        b.style.opacity = '1';
                        b.style.transform = 'scale(1.05)';
                    } else {
                        b.style.opacity = '0.7';
                        b.style.transform = 'scale(1)';
                    }
                });
                
                // Aplica filtro
                this.aplicarFiltro(filtroAtivo, selectedClient);
            });
        });
    }
    
    // Aplica filtro de visualização nas células
    aplicarFiltro(filtro, selectedClient) {
        const celulas = document.querySelectorAll('.tarefa-cell');
        
        celulas.forEach(cell => {
            const etapaId = cell.getAttribute('data-etapa-id');
            const acaoIdx = parseInt(cell.getAttribute('data-acao-idx'));
            
            if (!etapaId || isNaN(acaoIdx)) {
                return; // Célula vazia
            }
            
            const isConcluida = selectedClient.tarefas_concluidas[etapaId] && 
                               selectedClient.tarefas_concluidas[etapaId].includes(acaoIdx);
            
            if (filtro === 'todas') {
                cell.style.display = '';
                cell.parentElement.style.display = '';
            } else if (filtro === 'pendentes') {
                if (isConcluida) {
                    cell.style.opacity = '0.3';
                } else {
                    cell.style.opacity = '1';
                }
            } else if (filtro === 'concluidas') {
                if (!isConcluida) {
                    cell.style.opacity = '0.3';
                } else {
                    cell.style.opacity = '1';
                }
            }
        });
    }
    
    // Configura o botão de histórico
    configurarBotaoHistorico(selectedClient) {
        const btnHistorico = document.getElementById('btn-historico');
        
        if (btnHistorico) {
            // Remove listeners antigos
            const newBtn = btnHistorico.cloneNode(true);
            btnHistorico.parentNode.replaceChild(newBtn, btnHistorico);
            
            // Adiciona novo listener
            newBtn.addEventListener('click', () => {
                this.abrirModalHistorico(selectedClient.id);
            });
        }
    }
    
    // Abre o modal de histórico
    async abrirModalHistorico(clienteId) {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                this.showToast('error', 'Você precisa estar autenticado para ver o histórico');
                return;
            }
            
            const response = await fetch(`/api/historico/cliente/${clienteId}?limit=50`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.status === 401) {
                this.showToast('error', 'Sessão expirada. Faça login novamente.');
                // Redireciona para login após 2 segundos
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
                return;
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Erro ao buscar histórico');
            }
            
            const data = await response.json();
            this.renderizarModalHistorico(data.historico, clienteId);
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
            this.showToast('error', error.message || 'Erro ao carregar histórico');
        }
    }
    
    // Renderiza o modal de histórico
    renderizarModalHistorico(historico, clienteId) {
        // Remove modal anterior se existir
        const modalAntigo = document.getElementById('modal-historico');
        if (modalAntigo) {
            modalAntigo.remove();
        }
        
        // Cria o modal
        const modal = document.createElement('div');
        modal.id = 'modal-historico';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            max-width: 900px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            padding: 24px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        `;
        
        const historicoHTML = historico.length === 0 
            ? '<p style="text-align:center;color:#888;padding:40px;">Nenhuma alteração registrada ainda.</p>'
            : `
                <div style="display:flex;flex-direction:column;gap:12px;">
                    ${historico.map(h => {
                        const dataFormatada = new Date(h.data_hora).toLocaleString('pt-BR');
                        const icone = h.operacao === 'marcada' ? '✅' : '❌';
                        const corOperacao = h.operacao === 'marcada' ? '#10b981' : '#ef4444';
                        
                        return `
                            <div style="background:#f9fafb;padding:16px;border-radius:8px;border-left:4px solid ${corOperacao};">
                                <div style="display:flex;justify-content:space-between;align-items:start;gap:12px;flex-wrap:wrap;">
                                    <div style="flex:1;">
                                        <div style="font-weight:600;color:#1f2937;margin-bottom:4px;">
                                            ${icone} <span style="text-transform:uppercase;color:${corOperacao};">${h.operacao}</span>
                                        </div>
                                        <div style="color:#6b7280;font-size:14px;margin-bottom:4px;">
                                            <strong>Etapa:</strong> ${h.etapa.replace(/_/g, ' ').toUpperCase()}
                                        </div>
                                        <div style="color:#6b7280;font-size:14px;margin-bottom:4px;">
                                            <strong>Ação:</strong> ${h.acao_nome}
                                        </div>
                                        ${h.observacao ? `<div style="color:#6b7280;font-size:13px;margin-top:8px;font-style:italic;">${h.observacao}</div>` : ''}
                                    </div>
                                    <div style="text-align:right;min-width:200px;">
                                        <div style="font-weight:600;color:#1f2937;font-size:14px;">
                                            👤 ${h.usuario_nome || 'Usuário desconhecido'}
                                        </div>
                                        <div style="color:#6b7280;font-size:12px;">
                                            ${h.usuario_perfil || 'Sem perfil'}
                                        </div>
                                        <div style="color:#9ca3af;font-size:12px;margin-top:4px;">
                                            🕒 ${dataFormatada}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        
        modalContent.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <h2 style="margin:0;color:#1f2937;font-size:24px;">📜 Histórico de Alterações</h2>
                <button id="btn-fechar-historico" style="background:none;border:none;font-size:28px;cursor:pointer;color:#6b7280;line-height:1;">×</button>
            </div>
            ${historicoHTML}
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Event listeners para fechar
        document.getElementById('btn-fechar-historico').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // Método para atualizar o dashboard de progresso em tempo real
    atualizarDashboardProgresso(selectedClient) {
        // Define estrutura de etapas e ações (mesma do renderEsteiraProcessosTableInTableContainer)
        const etapas = [
            { id: 'prospeccao', nome: '1 - PROSPECÇÃO 3 CANAIS', tipo: 'PROSPECÇÃO' },
            { id: 'aumentar_conexao', nome: '2- AUMENTAR CONEXÃO', tipo: 'PROSPECÇÃO' },
            { id: 'envio_consultor', nome: '3 - ENVIO DE CONSULTOR', tipo: 'REPRESENTANTE OU DISTRIB' },
            { id: 'efetivacao', nome: '4 - EFETIVAÇÃO', tipo: 'DIRETOR' },
            { id: 'registros_legais', nome: '5 - REGISTROS LEGAIS', tipo: 'DIRETOR' },
            { id: 'separacao', nome: '6 - SEPARAÇÃO', tipo: 'LOGÍSTICA' },
            { id: 'entrega', nome: '7 - ENTREGA', tipo: 'LOGÍSTICA' },
            { id: 'recebimentos', nome: '8- RECEBIMENTOS', tipo: 'FINANCEIRO' },
            { id: 'formacao', nome: '9 - FORMAÇÃO', tipo: 'FORMADORES' },
            { id: 'documentarios', nome: '10- DOCUMENTÁRIOS', tipo: 'MARKETING' },
            { id: 'gerar_graficos', nome: '11 - GERAR GRÁFICOS', tipo: 'TECNOGIA E GERENCIA DADOS' },
            { id: 'renovacao', nome: '12 - RENOVAÇÃO DE RELACIONAMENTO', tipo: 'PROSPECÇÃO' }
        ];
        
        const numAcoes = 5; // Número de ações por etapa
        const totalTarefas = etapas.length * numAcoes;
        const tarefasConcluidas = Object.values(selectedClient.tarefas_concluidas || {}).reduce((sum, arr) => sum + arr.length, 0);
        const percentualGeral = totalTarefas > 0 ? ((tarefasConcluidas / totalTarefas) * 100).toFixed(1) : 0;
        
        // Atualiza a barra de progresso principal
        const barraProgresso = document.querySelector('#esteira-processos-tabela .dashboard-barra-progresso');
        const textoProgresso = document.querySelector('#esteira-processos-tabela .dashboard-texto-progresso');
        
        if (barraProgresso) {
            barraProgresso.style.width = `${percentualGeral}%`;
        }
        
        if (textoProgresso) {
            textoProgresso.textContent = `${percentualGeral}% (${tarefasConcluidas}/${totalTarefas} tarefas)`;
        }
        
        // Atualiza os cards de progresso por etapa
        etapas.slice(0, 6).forEach((etapa, idx) => {
            const tarefasDaEtapa = selectedClient.tarefas_concluidas[etapa.id] || [];
            const percentual = (tarefasDaEtapa.length / numAcoes * 100).toFixed(0);
            
            const cardPercentual = document.querySelector(`#esteira-processos-tabela .dashboard-card-${idx} .card-percentual`);
            if (cardPercentual) {
                cardPercentual.textContent = `${percentual}%`;
            }
        });
        
        console.log('📊 Dashboard atualizado:', { percentualGeral, tarefasConcluidas, totalTarefas });
    }
    
    // Método para salvar tarefas do cliente no backend
    async salvarTarefasCliente(clienteId, tarefasConcluidas) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/clientes/${clienteId}/tarefas`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tarefas_concluidas: tarefasConcluidas })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao salvar tarefas');
        }
        
        return await response.json();
    }

    // Método para registrar alterações no histórico (audit log)
    async registrarHistorico(clienteId, etapa, acaoIdx, acaoNome, operacao) {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/historico/registrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    cliente_id: clienteId,
                    etapa: etapa,
                    acao_idx: acaoIdx,
                    acao_nome: acaoNome,
                    operacao: operacao
                })
            });
            
            if (!response.ok) {
                console.warn('⚠️ Erro ao registrar histórico (não crítico)');
            }
        } catch (error) {
            console.warn('⚠️ Erro ao registrar histórico (não crítico):', error);
        }
    }

    // Removido renderEsteiraProcessosGlobal global, agora só renderiza por etapa selecionada
    

    // Renderiza a tabela dinâmica tipo Excel para a etapa
    renderEsteiraProcessosTable(etapaId, container, selectedClient) {
        // Modelo Excel: etapas como colunas, ações/processos como linhas
        const etapas = [
            'Prospecção', 'Apresentação', 'Negociação', 'Fechamento', 'Pós-venda', 'Renovação'
        ];
        // Processos por etapa (pode expandir conforme o Excel real)
        const processos = [
            'Primeiro contato',
            'Apresentação do projeto (e-mail)',
            'Apresentação por vídeo/ligação',
            'Registro e alimentação de sistema',
            'Mostrar materiais e vantagens',
            'Coletar informações da outra parte',
            'Entender necessidades',
            'Conversas de fechamento',
            'Envio de propostas',
            'Análise e consideração de valores',
            'Acompanhamento da decisão',
            'Alinhamento final',
            'Ajustes de contrato',
            'Envio de documentos',
            'Apresentação de relatórios',
            'Acompanhamento dos resultados',
            'Treinamento',
            'Suporte',
            'Avaliação de performance',
            'Propostas de continuidade',
            'Reengajamento',
            'Reinício da prospecção'
        ];
        // Inicializa progresso do cliente se não existir
        if (!selectedClient.esteiraChecklistExcel) selectedClient.esteiraChecklistExcel = {};
        etapas.forEach(etapa => {
            if (!selectedClient.esteiraChecklistExcel[etapa]) {
                selectedClient.esteiraChecklistExcel[etapa] = processos.map(() => false);
            }
        });
        // Monta tabela Excel
        container.innerHTML = `
            <div style="width:100%;margin:24px 0 0 0;display:block;text-align:center;">
                <div style="max-width:1100px;width:100%;background:#fff;padding:16px 24px;border-radius:12px;box-shadow:0 1px 8px #0001;margin:auto;display:inline-block;">
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f3f4f6;">
                                <th style="padding:10px 8px;text-align:left;font-weight:600;">Processo</th>
                                ${etapas.map(etapa => `<th style='padding:10px 8px;text-align:center;font-weight:600;'>${etapa}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${processos.map((proc, idx) => {
                                return `<tr>
                                    <td style="padding:8px 6px;border-bottom:1px solid #eee;">${proc}</td>
                                    ${etapas.map(etapa => {
                                        const checked = selectedClient.esteiraChecklistExcel[etapa][idx];
                                        return `<td style='text-align:center;'><input type='checkbox' data-etapa='${etapa}' data-idx='${idx}' ${checked ? 'checked' : ''}></td>`;
                                    }).join('')}
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        // Evento para marcar/desmarcar processos
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', e => {
                const etapa = checkbox.getAttribute('data-etapa');
                const idx = parseInt(checkbox.getAttribute('data-idx'));
                selectedClient.esteiraChecklistExcel[etapa][idx] = checkbox.checked;
            });
        });
    }

    /**
     * Inicializa as referências dos elementos DOM
     */
    initializeElements() {
        console.log('🔍 Inicializando elementos DOM...');
        
        // Search and filters
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearch');
        this.stateFilterSelect = document.getElementById('stateFilter');
        this.cityFilterSelect = document.getElementById('cityFilter');
        this.microregionFilterSelect = document.getElementById('microregionFilter');
        this.typeFilterSelect = document.getElementById('typeFilter');
        this.applyFiltersBtn = document.getElementById('applyFilters');
        this.resetFiltersBtn = document.getElementById('resetFilters');
        this.addClientBtn = document.getElementById('addClientButton');
        
        console.log('✅ Elementos encontrados:', {
            searchInput: !!this.searchInput,
            applyFiltersBtn: !!this.applyFiltersBtn,
            resetFiltersBtn: !!this.resetFiltersBtn,
            typeFilterSelect: !!this.typeFilterSelect
        });
        
        if (!this.applyFiltersBtn) {
            console.error('❌ ERRO: Botão applyFilters não encontrado!');
        }
        
        // States
        this.loadingState = document.getElementById('loadingState');
        this.emptyState = document.getElementById('emptyState');
        this.tableSection = document.getElementById('tableSection');
        
        // Table
        this.tableBody = document.getElementById('tableBody');
        this.resultsCount = document.getElementById('resultsCount');
        this.totalCount = document.getElementById('totalCount');
        
        // Pagination
        this.paginationSection = document.getElementById('paginationSection');
        this.paginationInfo = document.getElementById('paginationInfo');
        this.firstPageBtn = document.getElementById('firstPage');
        this.prevPageBtn = document.getElementById('prevPage');
        this.nextPageBtn = document.getElementById('nextPage');
        this.lastPageBtn = document.getElementById('lastPage');
        this.pageNumbers = document.getElementById('pageNumbers');
        this.perPageSelect = document.getElementById('perPageSelect');
        
        // Modal
        this.modal = document.getElementById('clientModal');
        this.modalBackdrop = document.getElementById('modalBackdrop');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalBody = document.getElementById('modalBody');
        this.closeModalBtn = document.getElementById('closeModal');
        this.editClientBtn = document.getElementById('editClient');
        this.deleteClientBtn = document.getElementById('deleteClient');
        this.cancelModalBtn = document.getElementById('cancelModal');
        
        // Toast
        this.toastContainer = document.getElementById('toastContainer');
    }

    /**
     * Anexa os event listeners
     */
    attachEventListeners() {
        // Search
        this.searchInput.addEventListener('input', this.debounce(() => {
            this.searchTerm = this.searchInput.value.trim();
            console.log('⌨️ Busca digitada:', this.searchTerm);
            this.applyFilters();
            this.toggleClearButton();
        }, 300));
        
        this.clearSearchBtn.addEventListener('click', () => {
            this.searchInput.value = '';
            this.searchTerm = '';
            this.applyFilters();
            this.toggleClearButton();
        });
        
        // Filters
        this.stateFilterSelect.addEventListener('change', async () => {
            this.stateFilter = this.stateFilterSelect.value;
            this.cityFilter = '';
            this.microregionFilter = '';
            await this.updateCityFilter();
            await this.updateMicroregionFilter();
        });
        
        this.cityFilterSelect.addEventListener('change', () => {
            // Usar o texto (nome da cidade) para comparar com client.cidade
            const sel = this.cityFilterSelect;
            const opt = sel.options && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null;
            const text = opt ? opt.textContent : '';
            this.cityFilter = sel.value ? text : '';
        });
        
        this.microregionFilterSelect.addEventListener('change', () => {
            this.microregionFilter = this.microregionFilterSelect.value;
        });
        
        this.typeFilterSelect.addEventListener('change', () => {
            this.typeFilter = this.typeFilterSelect.value;
        });
        
        this.applyFiltersBtn.addEventListener('click', () => {
            console.log('🔵 Botão Aplicar Filtros clicado!');
            console.log('🔍 Filtros atuais:', {
                search: this.searchTerm,
                state: this.stateFilter,
                city: this.cityFilter,
                type: this.typeFilter
            });
            this.applyFilters();
        });
        
        this.resetFiltersBtn.addEventListener('click', () => {
            this.resetFilters();
        });
        
        // Add client button
        if (this.addClientBtn) {
            this.addClientBtn.addEventListener('click', () => {
                this.openAddClientModal();
            });
        }
        
        // Table sorting
        document.querySelectorAll('.sort-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const column = e.currentTarget.dataset.column;
                this.handleSort(column);
            });
        });
        
        // Pagination
        this.firstPageBtn.addEventListener('click', () => this.goToPage(1));
        this.prevPageBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        this.nextPageBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        this.lastPageBtn.addEventListener('click', () => this.goToPage(this.getTotalPages()));
        
        this.perPageSelect.addEventListener('change', () => {
            this.itemsPerPage = parseInt(this.perPageSelect.value);
            this.currentPage = 1;
            this.renderTable();
            this.renderPagination();
        });
        
        // Modal
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelModalBtn.addEventListener('click', () => this.closeModal());
        this.modalBackdrop.addEventListener('click', () => this.closeModal());
        
        if (this.editClientBtn) {
            this.editClientBtn.addEventListener('click', () => {
                const clientId = this.editClientBtn.dataset.clientId;
                if (clientId) {
                    const client = this.clients.find(c => c.id.toString() === clientId);
                    if (client) {
                        this.closeModal();
                        this.openEditModal(client);
                    }
                }
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display !== 'none') {
                this.closeModal();
            }
        });
        
        // Sanfona para mostrar/esconder tabela de processos
        const toggleEsteiraBtn = document.getElementById('toggleEsteiraProcessos');
        const esteiraSection = document.getElementById('esteiraProcessosSection');
        if (toggleEsteiraBtn && esteiraSection) {
            toggleEsteiraBtn.addEventListener('click', () => {
                if (esteiraSection.style.display === 'none' || esteiraSection.style.display === '') {
                    esteiraSection.style.display = 'block';
                    toggleEsteiraBtn.textContent = 'Esconder Processos';
                } else {
                    esteiraSection.style.display = 'none';
                    toggleEsteiraBtn.textContent = 'Mostrar Processos';
                }
            });
        }
    }

    /**
     * Inicializa os ícones do Lucide
     */
    initializeLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Carrega os dados iniciais
     */
    async loadInitialData() {
        // A verificação de autenticação agora é feita no DOMContentLoaded
        this.showLoadingState();
        try {
            this.apiAvailable = await checkApiHealth();
            if (this.apiAvailable) {
                console.log('✅ API disponível, carregando dados do servidor');
                await this.loadClientsFromAPI();
            } else {
                console.error('❌ API indisponível.');
                this.showToast('error', 'Erro: API indisponível. Verifique o backend.');
                this.clients = [];
                this.filteredClients = [];
            }
            await this.loadIBGEData();
            this.applyFilters();
        } catch (error) {
            console.error('❌ Erro ao carregar dados iniciais:', error);
            this.showToast('error', 'Erro ao carregar dados. Tente recarregar a página.');
            this.clients = [];
            this.filteredClients = [];
            this.applyFilters(); 
        } finally {
            this.hideLoadingState();
        }
    }

    /**
     * Carrega clientes da API
     */
    async loadClientsFromAPI(page = 1) {
        try {
            this.isLoading = true;
            const filters = { page, limit: this.itemsPerPage, search: this.searchTerm, state: this.stateFilter, city: this.cityFilter, type: this.typeFilter };
            
            // Carrega vendedores se ainda não foram carregados
            if (this.vendedores.length === 0) {
                await this.loadVendedores();
            }
            
            const apiResponse = await fetchClients(filters);
            // If API returns an object with 'data', use that; else, use the array directly
            let clients = Array.isArray(apiResponse) ? apiResponse : (Array.isArray(apiResponse.data) ? apiResponse.data : []);
            this.clients = clients;
            this.filteredClients = [...this.clients];
            console.log(`✅ Carregados ${this.clients.length} clientes da API`);
            // Always render table and show/hide table section
            this.renderTable();
            if (this.clients.length > 0) {
                this.tableSection.style.display = 'block';
                this.paginationSection.style.display = 'flex';
                this.emptyState.style.display = 'none';
            } else {
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Erro ao carregar clientes da API:', error);
            // Se o erro for de autenticação, o auth-manager já deve ter redirecionado
            if (error.message.includes('401') || error.message.includes('403')) {
                 this.showToast('error', 'Sessão expirada. Redirecionando para login...');
                 setTimeout(() => window.location.href = 'login.html', 2000);
            } else {
                 this.showToast('error', 'Não foi possível carregar os clientes.');
            }
            this.clients = [];
            this.filteredClients = [];
            this.renderTable();
            this.showEmptyState();
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Carrega dados do IBGE para os filtros
     */
    async loadIBGEData() {
        try {
            console.log('🌐 Carregando dados do IBGE...');
            await populateEstadosSelect(this.stateFilterSelect, true);
            console.log('✅ Dados do IBGE carregados.');
        } catch (error) {
            console.error('❌ Erro ao carregar dados do IBGE:', error);
            this.showToast('warning', 'Não foi possível carregar os filtros de localidade.');
            this.populateStateFilterFromClients();
        }
    }

    /**
     * Popula o filtro de estados com os estados únicos dos clientes (fallback)
     */
    populateStateFilterFromClients() {
        const uniqueStates = [...new Set(this.clients.map(client => client.uf))].sort();
        this.stateFilterSelect.innerHTML = '<option value="">Todos os Estados</option>';
        const stateNames = {
            'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 
            'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
            'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
            'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
            'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
            'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
            'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
        };
        uniqueStates.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = stateNames[state] ? `${state} - ${stateNames[state]}` : state;
            this.stateFilterSelect.appendChild(option);
        });
    }

    /**
     * Atualiza o filtro de cidades baseado no estado selecionado
     */
    async updateCityFilter() {
        try {
            if (this.stateFilter) {
                await populateMunicipiosSelect(this.cityFilterSelect, this.stateFilter, true);
            } else {
                this.cityFilterSelect.innerHTML = '<option value="">Todas as Cidades</option>';
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar filtro de cidades:', error);
            this.cityFilterSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    /**
     * Atualiza o filtro de microrregiões baseado no estado selecionado
     */
    async updateMicroregionFilter() {
        try {
            if (this.stateFilter) {
                await populateMicroregioesSelect(this.microregionFilterSelect, this.stateFilter, true);
            } else {
                this.microregionFilterSelect.innerHTML = '<option value="">Todas as Microrregiões</option>';
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar filtro de microrregiões:', error);
            this.microregionFilterSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    /**
     * Aplica filtros e busca
     */
    applyFilters(page = 1) {
        console.log('🔧 applyFilters() chamado. Página:', page);
        console.log('📊 Estado atual:', {
            searchTerm: this.searchTerm,
            stateFilter: this.stateFilter,
            cityFilter: this.cityFilter,
            typeFilter: this.typeFilter,
            apiAvailable: this.apiAvailable,
            totalClients: this.clients.length
        });
        
        // Sempre filtrar localmente usando a lista já carregada
        this.currentPage = page;
        console.log('💾 Filtrando localmente...');
        let tempClients = [...this.clients];
        console.log('📋 Total de clientes antes dos filtros:', tempClients.length);

        if (this.searchTerm) {
            tempClients = tempClients.filter(client => this.matchesSearchTerm(client, this.searchTerm));
            console.log('🔍 Após busca:', tempClients.length, 'clientes');
        }
        if (this.stateFilter) {
            tempClients = tempClients.filter(client => client.uf === this.stateFilter);
            console.log('🗺️ Após filtro de estado:', tempClients.length, 'clientes');
        }
        if (this.cityFilter) {
            tempClients = tempClients.filter(client => client.cidade === this.cityFilter);
            console.log('🏙️ Após filtro de cidade:', tempClients.length, 'clientes');
        }
        if (this.typeFilter) {
            tempClients = tempClients.filter(client => client.tipo === this.typeFilter);
            console.log('🏷️ Após filtro de tipo:', tempClients.length, 'clientes');
        }
        if (this.microregionFilter) {
            tempClients = tempClients.filter(client => {
                const mic = client.microrregiao || client.microregiao || client.microregion || client.microRegion || '';
                return mic === this.microregionFilter;
            });
            console.log('🧭 Após filtro de microrregião:', tempClients.length, 'clientes');
        }
        this.filteredClients = tempClients;
        console.log('✅ Clientes filtrados finais:', this.filteredClients.length);
        this.renderTable();
        this.renderPagination();
        this.updateResultsInfo();
        if (this.filteredClients.length === 0) {
            this.showEmptyState();
        } else {
            this.hideEmptyState();
        }
    }

    /**
     * Verifica se o cliente corresponde ao termo de busca
     */
    matchesSearchTerm(client, searchTerm) {
        const term = searchTerm.toLowerCase();
        // Busca por nome, tipo (convertido para texto legível), telefone, CNPJ, cidade, estado
        const typeText = clientTypes[client.tipo] || client.tipo || '';
        const searchFields = [
            client.nome, 
            typeText,
            client.telefone, 
            client.cnpj, 
            client.cidade, 
            client.uf,
            client.email
        ];
        return searchFields.some(field => field && field.toLowerCase().includes(term));
    }

    /**
     * Manipula a ordenação da tabela
     */
    handleSort(column) {
        const realColumn = columnFieldMap[column] || column;
        if (this.sortColumn === realColumn) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = realColumn;
            this.sortDirection = 'asc';
        }
        this.sortClients();
        this.renderTable();
        this.updateSortIcons();
    }

    /**
     * Ordena os clientes
     */
    sortClients() {
        this.filteredClients.sort((a, b) => {
            let valueA = a[this.sortColumn] || '';
            let valueB = b[this.sortColumn] || '';
            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
            if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Atualiza os ícones de ordenação
     */
    updateSortIcons() {
        document.querySelectorAll('.sort-button').forEach(button => {
            const icon = button.querySelector('i');
            button.classList.remove('active');
            const real = columnFieldMap[button.dataset.column] || button.dataset.column;
            if (real === this.sortColumn) {
                button.classList.add('active');
                icon.setAttribute('data-lucide', this.sortDirection === 'asc' ? 'chevron-up' : 'chevron-down');
            } else {
                icon.setAttribute('data-lucide', 'chevron-up-down');
            }
        });
        this.initializeLucideIcons();
    }

    /**
     * Renderiza a tabela
     */
    renderTable() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageClients = this.filteredClients.slice(startIndex, endIndex);
        this.tableBody.innerHTML = pageClients.map(client => this.createTableRow(client)).join('');
        this.attachRowEventListeners();
        this.initializeLucideIcons();
    }

    /**
     * Cria uma linha da tabela
     */
    createTableRow(client) {
        const typeText = clientTypes[client.tipo] || client.tipo || 'N/A';
        // ESTEIRA_CONFIG mapping (copied from Teste-lista/esteiraConfig.ts)
        const ESTEIRA_CONFIG = [
            { id: 'Prospecção', color: '#6B73FF' }, // azul (como na imagem)
            { id: 'Apresentação', color: '#00CED1' }, // azul claro (como na imagem)
            { id: 'Negociação', color: '#FFD700' }, // amarelo (como na imagem)
            { id: 'Fechamento', color: '#22c55e' }, // verde
            { id: 'Pós-venda', color: '#a21caf' }, // roxo
            { id: 'Renovação', color: '#FF8C42' }, // laranja (como na imagem)
            // Mapeamento adicional para os IDs da esteira de 12 etapas
            { id: 'prospeccao', color: '#6B73FF' },
            { id: 'aumentar_conexao', color: '#00CED1' },
            { id: 'envio_consultor', color: '#FFB366' },
            { id: 'efetivacao', color: '#87CEEB' },
            { id: 'registros_legais', color: '#87CEEB' },
            { id: 'separacao', color: '#D3D3D3' },
            { id: 'entrega', color: '#D3D3D3' },
            { id: 'recebimentos', color: '#FFFF99' },
            { id: 'formacao', color: '#FFCC99' },
            { id: 'documentarios', color: '#FFCC99' },
            { id: 'gerar_graficos', color: '#FFCC99' },
            { id: 'renovacao', color: '#FF8C42' }
        ];
        // Find color for client.status
        let rowColor = '';
        if (client.status) {
            const etapa = ESTEIRA_CONFIG.find(e => e.id === client.status);
            if (etapa) {
                rowColor = etapa.color;
            }
        }
        // Use inline style for background color if found
        const nameStyleAttr = rowColor ? ` style=\"background-color: ${rowColor};\"` : '';
        
        // Dropdown de vendedores (editável)
        const vendedorId = client.vendedor_responsavel_id || '';
        const vendedorOptions = this.vendedores.map(v => 
            `<option value="${v.id}" ${v.id == vendedorId ? 'selected' : ''}>${this.escapeHtml(v.nome)}</option>`
        ).join('');
        
        const vendedorDropdown = `
            <div class="vendedor-select-container" style="display:flex;align-items:center;gap:8px;">
                <select class="vendedor-select" data-client-id="${client.id}" style="padding:6px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;cursor:pointer;background:white;outline:none;min-width:150px;transition:all 0.2s ease;" onchange="event.stopPropagation()">
                    <option value="">Sem Vendedor</option>
                    ${vendedorOptions}
                </select>
                ${vendedorId ? `<a href="vendedor-perfil.html?id=${vendedorId}" class="vendedor-link" title="Ver perfil" style="display:inline-flex;align-items:center;color:#667eea;text-decoration:none;" onclick="event.stopPropagation()"><i data-lucide="external-link" style="width:16px;height:16px;"></i></a>` : ''}
            </div>
        `;
        
        return `
            <tr class="client-row" data-client-id="${client.id}">
                <td class="client-name"${nameStyleAttr}>
                    <button class="action-icon-btn esteira-btn-modern" data-action="esteira" data-client-id="${client.id}" title="Abrir Dashboard da Esteira - ${this.escapeHtml(client.status || 'Prospecção')}" aria-label="Abrir Dashboard da Esteira">
                        <i data-lucide="trending-up" style="width:16px;height:16px;"></i>
                        <span>${this.escapeHtml(client.status || 'Prospecção')}</span>
                    </button>
                    ${this.escapeHtml(client.nome)}
                </td>
                <td class="client-type">${this.escapeHtml(typeText)}</td>
                <td class="client-phone">${this.escapeHtml(client.telefone)}</td>
                <td class="client-cnpj">${this.escapeHtml(client.cnpj)}</td>
                <td class="client-city">${this.escapeHtml(client.cidade)}</td>
                <td class="client-state">${this.escapeHtml(client.uf)}</td>
                <td class="client-vendedor">${vendedorDropdown}</td>
                <td>
                    <div class="actions-container">
                        <button class="action-icon-btn view-btn" data-action="view" data-client-id="${client.id}" title="Visualizar" aria-label="Visualizar ${client.nome}">
                            <i data-lucide="eye"></i>
                        </button>
                        <button class="action-icon-btn calendar-btn" data-action="calendar" data-client-id="${client.id}" title="Histórico/Calendário" aria-label="Abrir Calendário de ${client.nome}">
                            <i data-lucide="calendar"></i>
                        </button>
                        <button class="action-icon-btn whatsapp-btn" data-action="whatsapp" data-client-id="${client.id}" data-client-name="${this.escapeHtml(client.nome)}" data-client-phone="${this.escapeHtml(client.telefone)}" title="WhatsApp" aria-label="Enviar WhatsApp para ${client.nome}">
                            <i data-lucide="message-circle"></i>
                        </button>
                        <button class="action-icon-btn email-btn" data-action="email" data-client-id="${client.id}" data-client-name="${this.escapeHtml(client.nome)}" data-client-email="${this.escapeHtml(client.email || '')}" title="E-mail" aria-label="Enviar E-mail para ${client.nome}">
                            <i data-lucide="mail"></i>
                        </button>
                        <button class="action-icon-btn delete-btn" data-action="delete" data-client-id="${client.id}" title="Excluir Cliente" aria-label="Excluir ${client.nome}">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
                <td class="checkbox-cell">
                    <input type="checkbox" class="row-checkbox" data-client-id="${client.id}" data-client-name="${this.escapeHtml(client.nome)}" data-client-phone="${this.escapeHtml(client.telefone)}" data-client-email="${this.escapeHtml(client.email || '')}" onclick="event.stopPropagation()" aria-label="Selecionar ${this.escapeHtml(client.nome)}" title="Selecionar ${this.escapeHtml(client.nome)}">
                </td>
            </tr>
        `;
    }

    /**
     * Anexa event listeners para as linhas da tabela
     */
    attachRowEventListeners() {
        // Checkboxes
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                if (window.bulkSendManager) {
                    window.bulkSendManager.handleRowCheckboxChange(checkbox);
                }
            });
        });
        
        // Removido clique na linha para detalhes; apenas ícone do olho abre detalhes
        
        // Botões de ação
        document.querySelectorAll('.action-icon-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const { action, clientId } = e.currentTarget.dataset;
                this.handleClientAction(action, clientId, e.currentTarget);
            });
        });
        
        // Dropdowns de vendedor (atualizar cliente ao mudar)
        document.querySelectorAll('.vendedor-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                e.stopPropagation();
                const clientId = e.currentTarget.dataset.clientId;
                const vendedorId = e.currentTarget.value;
                await this.updateClientVendedor(clientId, vendedorId);
            });
            
            // Estilo de hover
            select.addEventListener('mouseenter', (e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            });
            select.addEventListener('mouseleave', (e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
            });
        });
    }

    /**
     * Manipula ações do cliente
     */
    handleClientAction(action, clientId, buttonElement) {
        const client = this.clients.find(c => c.id.toString() === clientId);
        if (!client) return;
        
        switch (action) {
            case 'view':
                // Navega para a página de detalhes do cliente
                window.location.href = `client-details.html?id=${clientId}`;
                break;
            case 'edit':
                this.openEditModal(client);
                break;
            case 'delete':
                this.confirmDeleteClient(clientId);
                break;
            case 'whatsapp':
                if (window.bulkSendManager) {
                    // Simula um checkbox para o bulk send manager
                    const fakeCheckbox = {
                        dataset: { clientId: client.id.toString() },
                        checked: true
                    };
                    window.bulkSendManager.handleRowCheckboxChange(fakeCheckbox);
                    // Abre diretamente o WhatsApp para envio rápido
                    window.bulkSendManager.openQuickWhatsApp(client);
                }
                break;
            case 'email':
                if (window.bulkSendManager) {
                    window.bulkSendManager.openQuickEmail({
                        id: client.id,
                        nome: client.nome,
                        name: client.nome,
                        email: client.email || ''
                    });
                }
                break;
            case 'document':
                if (window.bulkSendManager) {
                    window.bulkSendManager.openQuickDocument({
                        id: client.id,
                        nome: client.nome,
                        name: client.nome
                    });
                }
                break;
            case 'esteira':
                this.openEsteiraModal(clientId);
                break;
            case 'calendar':
                this.openCalendarModal(client);
                break;
            case 'more':
                this.showToast('info', `Mais opções para: ${client.nome}`);
                break;
        }
    }

    /**
     * Confirma a exclusão de um cliente
     */
    async confirmDeleteClient(clientId) {
        const client = this.clients.find(c => c.id.toString() === clientId);
        if (!client) {
            this.showToast('error', 'Cliente não encontrado');
            return;
        }

        const confirmMessage = `Tem certeza que deseja excluir o cliente "${client.nome}"?\n\nEsta ação não pode ser desfeita!`;
        
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            await apiClient.delete(`/clientes/${clientId}`);
            this.showToast('success', `Cliente "${client.nome}" excluído com sucesso`);
            
            // Remove da lista local
            this.clients = this.clients.filter(c => c.id.toString() !== clientId);
            
            // Recarrega a tabela
            this.renderTable();
            this.renderPagination();
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            this.showToast('error', `Erro ao excluir cliente: ${error.message}`);
        }
    }

    /**
     * Abre o modal de calendário/histórico do cliente (estilo Gmail)
     */
    async openCalendarModal(client) {
        console.log('📅 Abrindo calendário para cliente:', client.nome);
        
        // Carrega histórico do cliente
        const historico = await this.carregarHistoricoCliente(client.id);
        
        // Cria ou obtém o modal
        let modal = document.getElementById('calendar-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'calendar-modal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }
        
        // Data atual
        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        
        // Inicializa estado do calendário
        this.calendarState = {
            clientId: client.id,
            clientName: client.nome,
            currentMonth: mesAtual,
            currentYear: anoAtual,
            eventos: historico || {},
            selectedDate: null
        };
        
        modal.innerHTML = this.renderCalendarModalContent();
        modal.classList.add('active');
        
        // Inicializa ícones Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Adiciona event listeners do calendário
        this.attachCalendarEventListeners();
    }

    /**
     * Carrega histórico de eventos do cliente
     */
    async carregarHistoricoCliente(clientId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/clientes/${clientId}/calendario`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.eventos || {};
            }
        } catch (error) {
            console.warn('⚠️ Erro ao carregar histórico do calendário:', error);
        }
        return {};
    }

    /**
     * Salva evento no calendário do cliente
     */
    async salvarEventoCalendario(clientId, dataStr, evento) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/clientes/${clientId}/calendario`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ data: dataStr, evento })
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('❌ Erro ao salvar evento:', error);
        }
        return null;
    }

    /**
     * Renderiza o conteúdo do modal de calendário (versão compacta com múltiplos meses)
     */
    renderCalendarModalContent() {
        const { clientName, currentYear, eventos } = this.calendarState;
        
        const meses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 
                       'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
        
        const mesesAbrev = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 
                            'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        
        const diasSemanaAbrev = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        
        const hoje = new Date();
        
        // Gera HTML para um mês pequeno
        const renderMiniMonth = (mes, ano) => {
            const primeiroDia = new Date(ano, mes, 1);
            const ultimoDia = new Date(ano, mes + 1, 0);
            const diasNoMes = ultimoDia.getDate();
            const diaInicioSemana = primeiroDia.getDay();
            
            let diasHTML = '';
            
            // Dias vazios antes do início do mês
            for (let i = 0; i < diaInicioSemana; i++) {
                diasHTML += '<span class="mini-day empty"></span>';
            }
            
            // Dias do mês
            for (let dia = 1; dia <= diasNoMes; dia++) {
                const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                const eventosDoDia = eventos[dataStr] || [];
                const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
                const temEventos = eventosDoDia.length > 0;
                const isDomingo = new Date(ano, mes, dia).getDay() === 0;
                const isSabado = new Date(ano, mes, dia).getDay() === 6;
                const isSelected = this.calendarState.selectedDate === dataStr;
                
                let classes = 'mini-day';
                if (isHoje) classes += ' today';
                if (temEventos) classes += ' has-events';
                if (isDomingo) classes += ' domingo';
                if (isSabado) classes += ' sabado';
                if (isSelected) classes += ' selected';
                
                diasHTML += `<span class="${classes}" data-date="${dataStr}">${dia}</span>`;
            }
            
            return `
                <div class="mini-calendar" data-month="${mes}" data-year="${ano}">
                    <div class="mini-calendar-header">${meses[mes]}</div>
                    <div class="mini-calendar-weekdays">
                        ${diasSemanaAbrev.map((d, i) => `<span class="${i === 0 ? 'domingo' : i === 6 ? 'sabado' : ''}">${d}</span>`).join('')}
                    </div>
                    <div class="mini-calendar-days">
                        ${diasHTML}
                    </div>
                </div>
            `;
        };
        
        // Renderiza 4 meses (atual e próximos 3, ou configurável)
        const mesAtual = this.calendarState.currentMonth;
        const mesesParaMostrar = [];
        for (let i = 0; i < 4; i++) {
            let mes = mesAtual + i;
            let ano = currentYear;
            if (mes > 11) {
                mes -= 12;
                ano += 1;
            }
            mesesParaMostrar.push({ mes, ano });
        }

        return `
            <div class="calendar-modal-content compact">
                <div class="calendar-modal-header">
                    <h2><i data-lucide="calendar"></i> Histórico - ${this.escapeHtml(clientName)}</h2>
                    <button class="close-modal-btn" id="closeCalendarModal">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <div class="calendar-body-compact">
                    <!-- Navegação do ano -->
                    <div class="year-nav">
                        <button class="nav-btn-small" id="prevYear">
                            <i data-lucide="chevrons-left"></i>
                        </button>
                        <button class="nav-btn-small" id="prevMonth">
                            <i data-lucide="chevron-left"></i>
                        </button>
                        <span class="current-year">${currentYear}</span>
                        <button class="nav-btn-small" id="nextMonth">
                            <i data-lucide="chevron-right"></i>
                        </button>
                        <button class="nav-btn-small" id="nextYear">
                            <i data-lucide="chevrons-right"></i>
                        </button>
                    </div>
                    
                    <!-- Grid de mini calendários -->
                    <div class="mini-calendars-grid">
                        ${mesesParaMostrar.map(m => renderMiniMonth(m.mes, m.ano)).join('')}
                    </div>
                    
                    <!-- Tabela de horários do dia selecionado -->
                    <div class="schedule-table-container" id="scheduleTable">
                        <p class="schedule-hint"><i data-lucide="mouse-pointer-click"></i> Clique em um dia para ver/adicionar atividades</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza a tabela de horários para um dia específico
     */
    renderScheduleTable(dataStr) {
        const eventos = this.calendarState.eventos[dataStr] || [];
        const dateParts = dataStr.split('-');
        const dataFormatada = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        
        const horarios = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
                         '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
        
        const tiposAtividade = [
            { id: 'escola', label: 'Escola', color: '#4CAF50' },
            { id: 'gym', label: 'Gym', color: '#2196F3' },
            { id: 'reuniao', label: 'Reunião', color: '#9C27B0' },
            { id: 'ligacao', label: 'Ligação', color: '#FF9800' },
            { id: 'email', label: 'E-mail', color: '#E91E63' },
            { id: 'visita', label: 'Visita', color: '#00BCD4' },
            { id: 'off', label: 'Off', color: '#607D8B' },
            { id: 'cleaning', label: 'Cleaning', color: '#8BC34A' },
            { id: 'pesquisa', label: 'Pesquisa', color: '#673AB7' },
            { id: 'proposta', label: 'Proposta', color: '#F44336' },
            { id: 'contrato', label: 'Contrato', color: '#009688' },
            { id: 'outro', label: 'Outro', color: '#795548' }
        ];
        
        // Agrupa eventos por horário
        const eventosPorHora = {};
        eventos.forEach(ev => {
            const hora = ev.hora || '08:00';
            if (!eventosPorHora[hora]) eventosPorHora[hora] = [];
            eventosPorHora[hora].push(ev);
        });

        return `
            <div class="schedule-day-header">
                <h4><i data-lucide="calendar-days"></i> ${dataFormatada}</h4>
                <button class="add-event-btn" id="addEventBtn" data-date="${dataStr}">
                    <i data-lucide="plus"></i> Adicionar
                </button>
            </div>
            
            <!-- Cabeçalho da tabela -->
            <div class="schedule-table-header">
                <div class="col-time">Horário</div>
                <div class="col-action">Ação</div>
                <div class="col-execution">Execução</div>
                <div class="col-position">Posicionamento do Vendedor</div>
            </div>
            
            <div class="schedule-grid">
                ${horarios.map(hora => {
                    const evs = eventosPorHora[hora] || [];
                    const ev = evs[0]; // Primeiro evento do horário
                    const tipo = ev ? (tiposAtividade.find(t => t.id === ev.tipo) || tiposAtividade[tiposAtividade.length - 1]) : null;
                    
                    return `
                        <div class="schedule-row" data-hora="${hora}">
                            <div class="schedule-time">${hora}</div>
                            <div class="schedule-col-action">
                                ${ev ? `
                                    <span class="action-tag" style="background-color: ${tipo.color}25; color: ${tipo.color}; border: 1px solid ${tipo.color}">
                                        ${tipo.label}
                                    </span>
                                ` : '<span class="empty-cell">-</span>'}
                            </div>
                            <div class="schedule-col-execution">
                                ${ev && ev.execucao ? `<span class="execution-text">${this.escapeHtml(ev.execucao)}</span>` : '<span class="empty-cell">-</span>'}
                            </div>
                            <div class="schedule-col-position">
                                ${ev && ev.posicionamento ? `<span class="position-text">${this.escapeHtml(ev.posicionamento)}</span>` : '<span class="empty-cell">-</span>'}
                                ${ev ? `
                                    <button class="remove-event-btn" data-date="${dataStr}" data-hora="${hora}" data-tipo="${ev.tipo}" title="Remover">
                                        <i data-lucide="x"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <!-- Extras/Pausas section como na imagem -->
            <div class="extras-section">
                <h5>Extras / Pausas</h5>
                <div class="extras-grid">
                    ${['off', 'cleaning', 'pesquisa'].map(tipoId => {
                        const tipo = tiposAtividade.find(t => t.id === tipoId);
                        const temEvento = eventos.some(ev => ev.tipo === tipoId);
                        return `
                            <button class="extra-btn ${temEvento ? 'active' : ''}" 
                                    data-date="${dataStr}" data-tipo="${tipoId}"
                                    style="${temEvento ? `background-color: ${tipo.color}20; border-color: ${tipo.color}` : ''}">
                                ${tipo.label}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Abre modal para adicionar evento
     */
    openAddEventModal(dataStr) {
        const tiposAtividade = [
            { id: 'escola', label: 'Escola' },
            { id: 'gym', label: 'Gym' },
            { id: 'reuniao', label: 'Reunião' },
            { id: 'ligacao', label: 'Ligação' },
            { id: 'email', label: 'E-mail' },
            { id: 'visita', label: 'Visita' },
            { id: 'proposta', label: 'Proposta' },
            { id: 'contrato', label: 'Contrato' },
            { id: 'outro', label: 'Outro' }
        ];
        
        const horarios = [];
        for (let h = 8; h <= 20; h++) {
            horarios.push(`${String(h).padStart(2, '0')}:00`);
        }
        
        let addModal = document.getElementById('add-event-modal');
        if (!addModal) {
            addModal = document.createElement('div');
            addModal.id = 'add-event-modal';
            addModal.className = 'modal-overlay sub-modal';
            document.body.appendChild(addModal);
        }
        
        addModal.innerHTML = `
            <div class="add-event-content wide">
                <h3><i data-lucide="plus-circle"></i> Nova Atividade</h3>
                <form id="addEventForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Horário</label>
                            <select id="eventHora" required>
                                ${horarios.map(h => `<option value="${h}">${h}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Tipo de Atividade (Ação)</label>
                            <select id="eventTipo" required>
                                ${tiposAtividade.map(t => `<option value="${t.id}">${t.label}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Execução</label>
                        <input type="text" id="eventExecucao" placeholder="Ex: Apresentação de proposta, Follow-up, etc.">
                    </div>
                    <div class="form-group">
                        <label>Posicionamento do Vendedor</label>
                        <textarea id="eventPosicionamento" rows="3" placeholder="Ex: Aguardando retorno do cliente, Negociação em andamento..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" id="cancelAddEvent">Cancelar</button>
                        <button type="submit" class="btn-save">Salvar</button>
                    </div>
                </form>
            </div>
        `;
        
        addModal.classList.add('active');
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Event listeners do form
        document.getElementById('cancelAddEvent').addEventListener('click', () => {
            addModal.classList.remove('active');
        });
        
        document.getElementById('addEventForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const tipo = document.getElementById('eventTipo').value;
            const hora = document.getElementById('eventHora').value;
            const execucao = document.getElementById('eventExecucao').value;
            const posicionamento = document.getElementById('eventPosicionamento').value;
            
            await this.adicionarEvento(dataStr, { tipo, hora, execucao, posicionamento });
            addModal.classList.remove('active');
        });
    }

    /**
     * Adiciona um evento ao calendário
     */
    async adicionarEvento(dataStr, evento) {
        if (!this.calendarState.eventos[dataStr]) {
            this.calendarState.eventos[dataStr] = [];
        }
        
        this.calendarState.eventos[dataStr].push(evento);
        
        // Salva no backend
        await this.salvarEventoCalendario(
            this.calendarState.clientId, 
            dataStr, 
            this.calendarState.eventos[dataStr]
        );
        
        // Atualiza a UI
        this.atualizarCalendarioUI();
        this.showToast('success', 'Atividade adicionada!');
    }

    /**
     * Remove um evento do calendário
     */
    async removerEvento(dataStr, hora, tipo) {
        if (!this.calendarState.eventos[dataStr]) return;
        
        this.calendarState.eventos[dataStr] = this.calendarState.eventos[dataStr].filter(
            ev => !(ev.hora === hora && ev.tipo === tipo)
        );
        
        // Remove a data se não houver mais eventos
        if (this.calendarState.eventos[dataStr].length === 0) {
            delete this.calendarState.eventos[dataStr];
        }
        
        // Salva no backend
        await this.salvarEventoCalendario(
            this.calendarState.clientId, 
            dataStr, 
            this.calendarState.eventos[dataStr] || []
        );
        
        // Atualiza a UI
        this.atualizarCalendarioUI();
        this.showToast('info', 'Atividade removida');
    }

    /**
     * Toggle evento extra (off, cleaning, pesquisa)
     */
    async toggleExtraEvento(dataStr, tipo) {
        if (!this.calendarState.eventos[dataStr]) {
            this.calendarState.eventos[dataStr] = [];
        }
        
        const idx = this.calendarState.eventos[dataStr].findIndex(ev => ev.tipo === tipo);
        
        if (idx > -1) {
            // Remove
            this.calendarState.eventos[dataStr].splice(idx, 1);
            if (this.calendarState.eventos[dataStr].length === 0) {
                delete this.calendarState.eventos[dataStr];
            }
        } else {
            // Adiciona
            this.calendarState.eventos[dataStr].push({ tipo, hora: null, descricao: '' });
        }
        
        // Salva no backend
        await this.salvarEventoCalendario(
            this.calendarState.clientId, 
            dataStr, 
            this.calendarState.eventos[dataStr] || []
        );
        
        // Atualiza a UI
        this.atualizarCalendarioUI();
    }

    /**
     * Atualiza a UI do calendário
     */
    atualizarCalendarioUI() {
        const modal = document.getElementById('calendar-modal');
        if (modal) {
            modal.innerHTML = this.renderCalendarModalContent();
            
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            this.attachCalendarEventListeners();
            
            // Restaura a visualização do dia selecionado
            if (this.calendarState.selectedDate) {
                const scheduleTable = document.getElementById('scheduleTable');
                if (scheduleTable) {
                    scheduleTable.innerHTML = this.renderScheduleTable(this.calendarState.selectedDate);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                    this.attachScheduleEventListeners();
                }
            }
        }
    }

    /**
     * Anexa event listeners do calendário
     */
    attachCalendarEventListeners() {
        // Fechar modal
        document.getElementById('closeCalendarModal')?.addEventListener('click', () => {
            document.getElementById('calendar-modal')?.classList.remove('active');
        });
        
        // Navegação de ano (<<)
        document.getElementById('prevYear')?.addEventListener('click', () => {
            this.calendarState.currentYear--;
            this.atualizarCalendarioUI();
        });
        
        document.getElementById('nextYear')?.addEventListener('click', () => {
            this.calendarState.currentYear++;
            this.atualizarCalendarioUI();
        });
        
        // Navegação de mês (<)
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            this.calendarState.currentMonth--;
            if (this.calendarState.currentMonth < 0) {
                this.calendarState.currentMonth = 11;
                this.calendarState.currentYear--;
            }
            this.atualizarCalendarioUI();
        });
        
        document.getElementById('nextMonth')?.addEventListener('click', () => {
            this.calendarState.currentMonth++;
            if (this.calendarState.currentMonth > 11) {
                this.calendarState.currentMonth = 0;
                this.calendarState.currentYear++;
            }
            this.atualizarCalendarioUI();
        });
        
        // Clique nos dias (mini-day)
        document.querySelectorAll('.mini-day:not(.empty)').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                const dataStr = dayEl.dataset.date;
                this.calendarState.selectedDate = dataStr;
                
                // Remove seleção anterior
                document.querySelectorAll('.mini-day.selected').forEach(d => d.classList.remove('selected'));
                dayEl.classList.add('selected');
                
                // Renderiza tabela de horários
                const scheduleTable = document.getElementById('scheduleTable');
                if (scheduleTable) {
                    scheduleTable.innerHTML = this.renderScheduleTable(dataStr);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                    this.attachScheduleEventListeners();
                }
            });
        });
        
        // Fechar ao clicar fora
        document.getElementById('calendar-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'calendar-modal') {
                document.getElementById('calendar-modal').classList.remove('active');
            }
        });
    }

    /**
     * Anexa event listeners da tabela de horários
     */
    attachScheduleEventListeners() {
        // Botão adicionar evento
        document.getElementById('addEventBtn')?.addEventListener('click', (e) => {
            const dataStr = e.currentTarget.dataset.date;
            this.openAddEventModal(dataStr);
        });
        
        // Botões de remover evento
        document.querySelectorAll('.remove-event-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const { date, hora, tipo } = e.currentTarget.dataset;
                await this.removerEvento(date, hora, tipo);
            });
        });
        
        // Botões extras (off, cleaning, pesquisa)
        document.querySelectorAll('.extra-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const { date, tipo } = btn.dataset;
                await this.toggleExtraEvento(date, tipo);
            });
        });
    }

    /**
     * Abre o modal de edição
     */
    async openEsteiraModal(clientId) {
        console.log('🔵 openEsteiraModal chamado para cliente:', clientId);
        
        // Seleciona o cliente e mostra a barra de etapas do funil/esteira
        this.selectedClient = this.clients.find(c => c.id.toString() === clientId);
        
        if (!this.selectedClient) {
            console.error('❌ Cliente não encontrado:', clientId);
            this.showToast('error', 'Cliente não encontrado');
            return;
        }
        
        console.log('✅ Cliente encontrado:', this.selectedClient.nome);
        
        // Inicializa tarefas_concluidas se não existir
        if (!this.selectedClient.tarefas_concluidas) {
            this.selectedClient.tarefas_concluidas = {};
        }
        
        // Carrega as tarefas concluídas do backend
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/clientes/${clientId}/esteira`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 Dados recebidos do backend:', data);
                
                // Atualiza as tarefas concluídas do cliente selecionado
                if (data.tarefas_concluidas) {
                    this.selectedClient.tarefas_concluidas = typeof data.tarefas_concluidas === 'string' 
                        ? JSON.parse(data.tarefas_concluidas) 
                        : data.tarefas_concluidas;
                }
                if (data.status) {
                    this.selectedClient.status = data.status;
                }
            } else {
                console.warn('⚠️ Resposta não OK:', response.status);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar tarefas do cliente:', error);
        }
        
        console.log('🎯 Chamando renderEsteiraLegend...');
        this.renderEsteiraLegend(this.selectedClient);
    }
    openAddClientModal() {
        if (window.editModalManager) {
            // Abre o modal com um cliente vazio (modo criação)
            const emptyClient = {
                id: null,
                name: '',
                type: '',
                cnpj: '',
                phone: '',
                state: '',
                city: '',
                address: '',
                notes: ''
            };
            window.editModalManager.openModal(emptyClient, true); // true indica modo de criação
        } else {
            console.error('Edit Modal Manager não encontrado');
            this.showToast('error', 'Sistema de cadastro não disponível');
        }
    }

    /**
     * Verifica se o usuário pode editar o cliente
     */
    renderEsteiraProcessos(selectedClient) {
        const etapas = [
            'Prospecção',
            'Apresentação',
            'Negociação',
            'Fechamento',
            'Pós-venda',
            'Renovação'
        ];
        const checklistMap = {
            'Prospecção': [
                'Primeiro contato',
                'Apresentação do projeto (e-mail)',
                'Apresentação por vídeo/ligação',
                'Envio de material inicial'
            ],
            'Apresentação': [
                'Reunião de apresentação',
                'Envio de proposta',
                'Recebimento de feedback',
                'Ajuste de proposta'
            ],
            'Negociação': [
                'Negociação de valores',
                'Negociação de condições',
                'Aprovação interna',
                'Definição de cronograma'
            ],
            'Fechamento': [
                'Envio de contrato',
                'Assinatura do contrato',
                'Confirmação de pagamento',
                'Agendamento de onboarding'
            ],
            'Pós-venda': [
                'Onboarding realizado',
                'Primeiro acompanhamento',
                'Treinamento inicial',
                'Avaliação de satisfação'
            ],
            'Renovação': [
                'Contato para renovação',
                'Envio de nova proposta',
                'Negociação de renovação',
                'Confirmação de renovação'
            ]
        };
        const processosDiv = document.getElementById('esteira-processos');
        if (!processosDiv) return;
        if (!selectedClient) {
            processosDiv.innerHTML = '<div style="color:#888;text-align:center;padding:16px;">Selecione um cliente para ver os processos.</div>';
            return;
        }
        // Inicializa progresso do cliente se não existir
        if (!selectedClient.esteiraChecklist) selectedClient.esteiraChecklist = {};
        etapas.forEach(etapa => {
            if (!selectedClient.esteiraChecklist[etapa]) {
                selectedClient.esteiraChecklist[etapa] = (checklistMap[etapa] || []).map(() => false);
            }
        });
        // Monta todas as linhas possíveis (máximo de processos por etapa)
        const maxRows = Math.max(...etapas.map(etapa => (checklistMap[etapa] || []).length));
        processosDiv.innerHTML = `
            <table style="width:100%;border-collapse:collapse;background:#f9f9f9;box-shadow:0 1px 4px #0001;border-radius:8px;">
                <thead>
                    <tr style="background:#f3f4f6;">
                        <th style="padding:10px 8px;text-align:left;font-weight:600;">Processo</th>
                        ${etapas.map(etapa => `<th style='padding:10px 8px;text-align:center;font-weight:600;'>${etapa}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${Array.from({length: maxRows}).map((_, idx) => {
                        // Nome do processo (primeira etapa que tem esse índice)
                        let processoNome = '';
                        for (const etapa of etapas) {
                            if ((checklistMap[etapa] || [])[idx]) {
                                processoNome = checklistMap[etapa][idx];
                                break;
                            }
                        }
                        return `
                            <tr>
                                <td style='padding:8px 8px;'>${processoNome || ''}</td>
                                ${etapas.map(etapa => {
                                    const checked = selectedClient.esteiraChecklist[etapa][idx];
                                    return (checklistMap[etapa] && checklistMap[etapa][idx]) ? `<td style='padding:8px 8px;text-align:center;'><input type='checkbox' class='esteira-check' data-etapa='${etapa}' data-idx='${idx}' ${checked ? 'checked' : ''}></td>` : `<td></td>`;
                                }).join('')}
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        // Adiciona evento para marcar/desmarcar processos
        processosDiv.querySelectorAll('.esteira-check').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const etapa = checkbox.getAttribute('data-etapa');
                const idx = parseInt(checkbox.getAttribute('data-idx'));
                selectedClient.esteiraChecklist[etapa][idx] = checkbox.checked;
            });
        });
    }

    createPageButton(page) {
        const button = document.createElement('button');
        button.className = `page-number ${page === this.currentPage ? 'active' : ''}`;
        button.textContent = page;
        button.onclick = () => this.goToPage(page);
        return button;
    }

    createEllipsis() {
        const span = document.createElement('span');
        span.className = 'page-ellipsis';
        span.textContent = '...';
        return span;
    }

    goToPage(page) {
        const totalPages = this.getTotalPages();
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderTable();
            this.renderPagination();
            this.tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    getTotalPages() {
        return Math.ceil(this.filteredClients.length / this.itemsPerPage);
    }

    updateResultsInfo() {
        const total = this.clients.length;
        const filtered = this.filteredClients.length;
        console.log('📊 updateResultsInfo:', { total, filtered });
        if (filtered === total) {
            this.resultsCount.textContent = `${filtered} clientes encontrados`;
        } else {
            this.resultsCount.textContent = `${filtered} de ${total} clientes encontrados`;
        }
        this.totalCount.textContent = '';
        console.log('✅ Texto exibido:', this.resultsCount.textContent);
    }

    async resetFilters() {
        this.searchInput.value = '';
        this.stateFilterSelect.value = '';
        this.cityFilterSelect.value = '';
        this.microregionFilterSelect.value = '';
        this.typeFilterSelect.value = '';
        this.searchTerm = '';
        this.stateFilter = '';
        this.cityFilter = '';
        this.microregionFilter = '';
        this.typeFilter = '';
        this.cityFilterSelect.innerHTML = '<option value="">Todas as Cidades</option>';
        this.microregionFilterSelect.innerHTML = '<option value="">Todas as Microrregiões</option>';
        this.applyFilters();
        this.toggleClearButton();
    }

    toggleClearButton() {
        this.clearSearchBtn.style.display = this.searchInput.value ? 'flex' : 'none';
    }

    showLoadingState() {
        this.loadingState.style.display = 'flex';
        this.tableSection.style.display = 'none';
        this.paginationSection.style.display = 'none';
        this.emptyState.style.display = 'none';
    }

    hideLoadingState() {
        this.loadingState.style.display = 'none';
    }

    showEmptyState() {
        this.emptyState.style.display = 'flex';
        this.tableSection.style.display = 'none';
        this.paginationSection.style.display = 'none';
    }

    hideEmptyState() {
        this.emptyState.style.display = 'none';
        this.tableSection.style.display = 'block';
        this.paginationSection.style.display = 'flex';
    }

    showModal() {
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setTimeout(() => this.closeModalBtn.focus(), 100);
    }

    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    /**
     * Carrega a lista de vendedores ativos
     */
    async loadVendedores() {
        try {
            console.log('👥 Carregando vendedores...');
            const token = localStorage.getItem('token');
            const response = await fetch('/api/vendedores', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro ao carregar vendedores: ${response.status}`);
            }

            const result = await response.json();
            
            // O endpoint retorna { success, total, usuarios }
            const vendedores = result.usuarios || result.data || result;
            
            // Filtra apenas vendedores ativos
            this.vendedores = Array.isArray(vendedores) 
                ? vendedores.filter(v => v.ativo !== false)
                : [];
            
            console.log(`✅ ${this.vendedores.length} vendedores carregados`);
        } catch (error) {
            console.error('❌ Erro ao carregar vendedores:', error);
            this.vendedores = [];
            this.showToast('warning', 'Não foi possível carregar lista de vendedores');
        }
    }

    /**
     * Atualiza o vendedor responsável de um cliente
     */
    async updateClientVendedor(clientId, vendedorId) {
        try {
            console.log(`🔄 Atualizando vendedor do cliente ${clientId} para vendedor ${vendedorId || 'Nenhum'}`);
            
            // Busca o cliente completo
            const client = this.clients.find(c => c.id == clientId);
            if (!client) {
                throw new Error('Cliente não encontrado');
            }
            
            // Busca o nome do vendedor
            const vendedor = vendedorId 
                ? this.vendedores.find(v => v.id == vendedorId)
                : null;

            const token = localStorage.getItem('token');
            const response = await fetch(`/api/clientes/${clientId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    // Manter todos os dados do cliente
                    nome: client.nome,
                    tipo: client.tipo,
                    cnpj: client.cnpj,
                    cidade: client.cidade,
                    uf: client.uf,
                    telefone: client.telefone,
                    observacoes: client.observacoes,
                    status: client.status,
                    tarefas_concluidas: client.tarefas_concluidas,
                    // Atualizar apenas vendedor
                    vendedor_responsavel: vendedor ? vendedor.nome : null,
                    vendedor_responsavel_id: vendedorId || null
                })
            });

            if (!response.ok) {
                throw new Error(`Erro ao atualizar vendedor: ${response.status}`);
            }

            // Atualiza o cliente localmente
            const clientIndex = this.clients.findIndex(c => c.id == clientId);
            if (clientIndex !== -1) {
                this.clients[clientIndex].vendedor_responsavel = vendedor ? vendedor.nome : null;
                this.clients[clientIndex].vendedor_responsavel_id = vendedorId || null;
            }

            // Atualiza na lista filtrada também
            const filteredIndex = this.filteredClients.findIndex(c => c.id == clientId);
            if (filteredIndex !== -1) {
                this.filteredClients[filteredIndex].vendedor_responsavel = vendedor ? vendedor.nome : null;
                this.filteredClients[filteredIndex].vendedor_responsavel_id = vendedorId || null;
            }

            // Re-renderiza a tabela para atualizar o link "Ver perfil"
            this.renderTable();

            const mensagem = vendedor 
                ? `✅ ${vendedor.nome} atribuído como vendedor responsável`
                : `✅ Vendedor removido`;
            
            this.showToast('success', mensagem);
            console.log('✅ Vendedor atualizado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao atualizar vendedor:', error);
            this.showToast('error', 'Não foi possível atualizar o vendedor');
            
            // Recarrega a tabela em caso de erro para reverter a mudança visual
            this.renderTable();
        }
    }

    showToast(type, message, duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const iconMap = { success: 'check-circle', error: 'x-circle', info: 'info', warning: 'alert-triangle' };
        toast.innerHTML = `<i data-lucide="${iconMap[type] || 'info'}"></i><span class="toast-message">${this.escapeHtml(message)}</span>`;
        this.toastContainer.appendChild(toast);
        lucide.createIcons();
        setTimeout(() => {
            toast.style.animation = 'toastExit 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    escapeHtml(text) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text ? String(text).replace(/[&<>"']/g, m => map[m]) : '';
    }

    formatDate(date) {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.authManager || !window.authManager.isAuthenticated()) {
        window.location.href = 'login.html';
        return; // Impede a execução do resto do código
    }
    
    // Mostrar informações do usuário logado
    showUserInfo();
    
    // Configurar evento de logout
    setupLogout();
    
    window.clientManager = new ClientManager();
    window.clientManager.loadInitialData();
    console.log('Sistema de Gerenciamento de Clientes carregado.');
});

/**
 * Mostra as informações do usuário logado no header
 */
function showUserInfo() {
    const currentUser = window.authManager.getCurrentUser();
    
    if (currentUser) {
        // Mapeamento de perfil_id para nome do perfil
        const perfis = {
            1: 'Administrador',
            2: 'Consultor',
            3: 'Representante'
        };
        
        // Pegar elementos do DOM
        const userHeader = document.getElementById('userHeader');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        
        // Atualizar com dados do usuário
        if (userName) {
            userName.textContent = currentUser.nome || currentUser.email || 'Usuário';
        }
        
        if (userRole) {
            // Buscar nome do perfil pelo perfil_id
            const perfilNome = perfis[currentUser.perfil_id] || 'Usuário';
            userRole.textContent = perfilNome;
        }
        
        // Mostrar o header
        if (userHeader) {
            userHeader.style.display = 'flex';
        }
        
        // Mostrar botão de criar usuário apenas para administradores
        const createUserButton = document.getElementById('createUserButton');
        if (createUserButton && currentUser.perfil_id === 1) {
            createUserButton.style.display = 'flex';
        }
        
        // Inicializar ícones Lucide no header
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

/**
 * Configura os eventos de logout
 */
function setupLogout() {
    const logoutButton = document.getElementById('logoutButton');
    const logoutFromMenu = document.getElementById('logoutFromMenu');
    const comunicacaoEquipe = document.getElementById('comunicacaoEquipe');
    const userInfoButton = document.getElementById('userInfoButton');
    const userMenu = document.getElementById('userMenu');
    
    // Função de logout
    const handleLogout = () => {
        if (confirm('Deseja realmente sair do sistema?')) {
            window.authManager.logout();
            window.location.href = 'login.html';
        }
    };
    
    // Eventos de logout
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    if (logoutFromMenu) {
        logoutFromMenu.addEventListener('click', handleLogout);
    }

    // Evento para ir ao perfil do usuário
    if (userInfoButton) {
        userInfoButton.addEventListener('click', () => {
            window.location.href = 'user-profile.html';
        });
    }

    // Evento para comunicação da equipe
    if (comunicacaoEquipe) {
        comunicacaoEquipe.addEventListener('click', () => {
            window.location.href = 'comunicacao-equipe.html';
        });
    }
    
    // Evento para liberações de etapas (apenas admin e supervisores)
    const liberacoesEtapas = document.getElementById('liberacoesEtapas');
    if (liberacoesEtapas) {
        // Mostrar apenas se tem permissão
        const permissions = authManager.getUserPermissions();
        if (permissions.canApproveLiberacao) {
            liberacoesEtapas.style.display = 'flex';
        }
        
        liberacoesEtapas.addEventListener('click', () => {
            window.location.href = 'liberacoes-etapas.html';
        });
    }
    
    // Evento para gestão de equipe (apenas admin, diretor comercial e gerência)
    const gestaoEquipe = document.getElementById('gestaoEquipe');
    if (gestaoEquipe) {
        // Mostrar apenas se tem permissão (perfil 1=admin, 6=diretor_comercial, 10=gerencia_dados)
        const perfilId = authManager.getPerfilId();
        if (perfilId === 1 || perfilId === 6 || perfilId === 10) {
            gestaoEquipe.style.display = 'flex';
        }
        
        gestaoEquipe.addEventListener('click', () => {
            window.location.href = 'gestao-equipe.html';
        });
    }
    
    // Evento para gestão de vendedores (apenas admin, diretor comercial e gerência)
    const gestaoVendedores = document.getElementById('gestaoVendedores');
    if (gestaoVendedores) {
        // Mostrar apenas se tem permissão (perfil 1=admin, 6=diretor_comercial, 10=gerencia_dados)
        const perfilId = authManager.getPerfilId();
        console.log('🔍 Perfil do usuário para Gestão de Vendedores:', perfilId);
        // Temporariamente mostrar para todos os perfis autenticados para debug
        if (perfilId) {
            gestaoVendedores.style.display = 'flex';
            console.log('✅ Menu Gestão de Vendedores visível');
        }
        
        gestaoVendedores.addEventListener('click', () => {
            window.location.href = 'gestao-vendedores.html';
        });
    }
    
    // Controle do botão de cadastro de usuário
    const createUserButton = document.getElementById('createUserButton');
    const createUserModal = document.getElementById('createUserModal');
    const closeCreateUserModal = document.getElementById('closeCreateUserModal');
    const cancelCreateUser = document.getElementById('cancelCreateUser');
    const createUserForm = document.getElementById('createUserForm');
    
    if (createUserButton) {
        // Mostrar botão apenas para admin
        const perfilId = authManager.getPerfilId();
        if (perfilId === 1) {
            createUserButton.style.display = 'flex';
        }
        
        createUserButton.addEventListener('click', async () => {
            createUserModal.style.display = 'flex';
            // Carregar perfis disponíveis
            await loadPerfisForUserCreation();
            // Inicializa ícones do modal
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });
    }
    
    // Função auxiliar para carregar perfis
    async function loadPerfisForUserCreation() {
        try {
            const response = await apiClient.get('/liberacao/perfis');
            const perfilSelect = document.getElementById('newUserPerfil');
            
            if (response.success && response.perfis) {
                perfilSelect.innerHTML = '<option value="">Selecione um perfil</option>';
                response.perfis.forEach(perfil => {
                    const option = document.createElement('option');
                    option.value = perfil.id;
                    option.textContent = perfil.nome + (perfil.descricao ? ` - ${perfil.descricao}` : '');
                    perfilSelect.appendChild(option);
                });
                console.log('✅ Perfis carregados:', response.perfis.length);
            }
        } catch (error) {
            console.error('Erro ao carregar perfis:', error);
            if (window.app && typeof window.app.showToast === 'function') {
                window.app.showToast('error', 'Erro ao carregar perfis');
            }
        }
    }
    
    if (closeCreateUserModal) {
        closeCreateUserModal.addEventListener('click', () => {
            createUserModal.style.display = 'none';
            createUserForm.reset();
        });
    }
    
    if (cancelCreateUser) {
        cancelCreateUser.addEventListener('click', () => {
            createUserModal.style.display = 'none';
            createUserForm.reset();
        });
    }
    
    if (createUserModal) {
        createUserModal.addEventListener('click', (e) => {
            if (e.target === createUserModal) {
                createUserModal.style.display = 'none';
                createUserForm.reset();
            }
        });
    }
    
    if (createUserForm) {
        createUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nome = document.getElementById('newUserName').value.trim();
            const email = document.getElementById('newUserEmail').value.trim();
            const senha = document.getElementById('newUserPassword').value;
            const perfil_id = parseInt(document.getElementById('newUserPerfil').value);
            
            if (!nome || !email || !senha || !perfil_id) {
                if (window.app && typeof window.app.showToast === 'function') {
                    window.app.showToast('error', 'Preencha todos os campos obrigatórios');
                } else {
                    alert('Preencha todos os campos obrigatórios');
                }
                return;
            }
            
            try {
                const response = await apiClient.post('/usuarios', {
                    nome,
                    email,
                    senha,
                    perfil_id
                });
                
                if (window.app && typeof window.app.showToast === 'function') {
                    window.app.showToast('success', `Usuário ${nome} cadastrado com sucesso!`);
                } else {
                    alert(`Usuário ${nome} cadastrado com sucesso!`);
                }
                createUserModal.style.display = 'none';
                createUserForm.reset();
            } catch (error) {
                console.error('Erro ao cadastrar usuário:', error);
                if (window.app && typeof window.app.showToast === 'function') {
                    window.app.showToast('error', `Erro ao cadastrar usuário: ${error.message}`);
                } else {
                    alert(`Erro ao cadastrar usuário: ${error.message}`);
                }
            }
        });
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes toastExit {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
`;
document.head.appendChild(style);