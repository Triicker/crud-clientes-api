// vendedor-perfil.js - Script para página de perfil do vendedor

class VendedorPerfilManager {
    constructor() {
        this.vendedorId = null;
        this.vendedor = null;
        this.clientes = [];
        this.estatisticas = {
            total_clientes: 0,
            vendas_fechadas: 0,
            taxa_conversao: 0,
            total_interacoes: 0
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando VendedorPerfilManager');
        
        // Verifica autenticação
        if (!authManager || !authManager.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        // Pega o ID do vendedor da URL
        const urlParams = new URLSearchParams(window.location.search);
        this.vendedorId = urlParams.get('id');

        if (!this.vendedorId) {
            console.error('❌ ID do vendedor não fornecido');
            this.showError('ID do vendedor não foi fornecido.');
            return;
        }

        console.log('📋 Vendedor ID:', this.vendedorId);

        // Configura botão de logout
        this.setupLogoutButton();

        // Carrega dados do vendedor
        await this.carregarDadosVendedor();
    }

    setupLogoutButton() {
        const logoutBtn = document.getElementById('logoutButton');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                authManager.logout();
            });
        }

        // Atualiza informações do usuário na navbar
        const currentUser = authManager.getCurrentUser();
        if (currentUser) {
            const userNameEl = document.getElementById('userName');
            const userRoleEl = document.getElementById('userRole');
            
            if (userNameEl) {
                userNameEl.textContent = currentUser.nome || 'Usuário';
            }
            
            if (userRoleEl) {
                userRoleEl.textContent = currentUser.perfil_nome || currentUser.perfil || 'Usuário';
            }
        }
    }

    async carregarDadosVendedor() {
        try {
            console.log('🔄 Carregando dados do vendedor...');

            // Endpoint /api/vendedores/:id retorna TODOS os dados necessários
            // (perfil, estatísticas, clientes, histórico)
            const response = await this.fetchAPI(`/api/vendedores/${this.vendedorId}`);
            const vendedorCompleto = response.usuario || response.data?.usuario || response;

            // Extrai dados do vendedor
            this.vendedor = {
                id: vendedorCompleto.id,
                nome: vendedorCompleto.nome,
                email: vendedorCompleto.email,
                perfil_nome: vendedorCompleto.perfil_nome,
                meta_vendas_mensal: vendedorCompleto.meta_vendas_mensal || 0
            };

            // Extrai estatísticas
            const stats = vendedorCompleto.estatisticas_detalhadas || {};
            const clientesTotal = stats.total || 0;
            const vendas = (stats.por_status?.['Fechamento'] || 0) + (stats.por_status?.['Efetivação'] || 0);
            
            this.estatisticas = {
                total_clientes: clientesTotal,
                vendas_fechadas: vendas,
                taxa_conversao: clientesTotal > 0 ? ((vendas / clientesTotal) * 100) : 0,
                total_interacoes: vendedorCompleto.historico_recente?.length || 0
            };

            // Extrai clientes
            this.clientes = vendedorCompleto.clientes || [];

            console.log('✅ Dados completos carregados:', {
                vendedor: this.vendedor.nome,
                clientes: this.clientes.length,
                estatisticas: this.estatisticas
            });

            // Renderiza tudo
            this.renderizarCabecalho();
            this.renderizarEstatisticas();
            this.renderizarClientes();

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.showError('Erro ao carregar dados do vendedor. Verifique sua conexão.');
        }
    }

    renderizarCabecalho() {
        const nome = this.vendedor.nome || 'Vendedor';
        const perfil = this.vendedor.perfil_nome || 'Vendedor';
        const metaMensal = this.vendedor.meta_vendas_mensal || 0;

        // Avatar (primeira letra do nome)
        const primeiraLetra = nome.charAt(0).toUpperCase();
        document.getElementById('perfilAvatar').textContent = primeiraLetra;

        // Nome
        document.getElementById('perfilNome').textContent = nome;

        // Perfil
        const perfilElement = document.getElementById('perfilPerfil');
        perfilElement.querySelector('span').textContent = perfil;

        // Meta mensal
        document.getElementById('perfilMeta').innerHTML = `
            <i data-lucide="target"></i>
            Meta: R$ ${metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
        `;

        // Reinicializa os ícones do Lucide
        lucide.createIcons();
    }

    renderizarEstatisticas() {
        document.getElementById('statClientes').textContent = this.estatisticas.total_clientes;
        document.getElementById('statVendas').textContent = this.estatisticas.vendas_fechadas;
        document.getElementById('statConversao').textContent = `${this.estatisticas.taxa_conversao.toFixed(1)}%`;
        document.getElementById('statInteracoes').textContent = this.estatisticas.total_interacoes;
    }

    renderizarClientes() {
        const container = document.getElementById('clientesContainer');

        if (this.clientes.length === 0) {
            this.showEmptyState('Este vendedor ainda não possui clientes atribuídos.');
            return;
        }

        const statusMap = {
            'prospeccao': { label: 'Prospecção', class: 'status-prospeccao' },
            'aumentar_conexao': { label: 'Aumentar Conexão', class: 'status-prospeccao' },
            'envio_consultor': { label: 'Envio de Consultor', class: 'status-apresentacao' },
            'efetivacao': { label: 'Efetivação', class: 'status-negociacao' },
            'registros_legais': { label: 'Registros Legais', class: 'status-negociacao' },
            'separacao': { label: 'Separação', class: 'status-fechamento' },
            'entrega': { label: 'Entrega', class: 'status-fechamento' },
            'recebimentos': { label: 'Recebimentos', class: 'status-fechamento' },
            'formacao': { label: 'Formação', class: 'status-fechamento' },
            'documentarios': { label: 'Documentários', class: 'status-fechamento' },
            'gerar_graficos': { label: 'Gerar Gráficos', class: 'status-fechamento' },
            'renovacao': { label: 'Renovação', class: 'status-prospeccao' },
            'Prospecção': { label: 'Prospecção', class: 'status-prospeccao' },
            'Apresentação': { label: 'Apresentação', class: 'status-apresentacao' },
            'Negociação': { label: 'Negociação', class: 'status-negociacao' },
            'Fechamento': { label: 'Fechamento', class: 'status-fechamento' }
        };

        const clientTypes = {
            'network': 'Rede de Ensino',
            'school': 'Escola'
        };

        const tableHTML = `
            <div class="table-container">
                <table class="client-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Tipo</th>
                            <th>Cidade/UF</th>
                            <th>Status</th>
                            <th>Telefone</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.clientes.map(cliente => {
                            const status = statusMap[cliente.status] || { label: cliente.status || 'Prospecção', class: 'status-prospeccao' };
                            const tipo = clientTypes[cliente.tipo] || cliente.tipo || 'N/A';
                            const telefone = cliente.telefone || 'N/A';
                            const cidade = cliente.cidade || 'N/A';
                            const uf = cliente.uf || '';
                            const localizacao = uf ? `${cidade} / ${uf}` : cidade;

                            return `
                                <tr>
                                    <td><strong>${this.escapeHtml(cliente.nome)}</strong></td>
                                    <td>${this.escapeHtml(tipo)}</td>
                                    <td>${this.escapeHtml(localizacao)}</td>
                                    <td>
                                        <span class="status-badge ${status.class}">
                                            ${this.escapeHtml(status.label)}
                                        </span>
                                    </td>
                                    <td>${this.escapeHtml(telefone)}</td>
                                    <td>
                                        <a href="client-details.html?id=${cliente.id}" class="btn-acao btn-visualizar">
                                            <i data-lucide="eye"></i>
                                            Ver Detalhes
                                        </a>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;

        // Reinicializa os ícones
        lucide.createIcons();
    }

    showEmptyState(mensagem) {
        const container = document.getElementById('clientesContainer');
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="users-round"></i>
                <h3>Nenhum cliente encontrado</h3>
                <p>${mensagem}</p>
            </div>
        `;
        lucide.createIcons();
    }

    showError(mensagem) {
        const container = document.getElementById('clientesContainer');
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="alert-circle"></i>
                <h3>Erro ao carregar</h3>
                <p>${mensagem}</p>
            </div>
        `;
        lucide.createIcons();
    }

    async fetchAPI(endpoint) {
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('Token de autenticação não encontrado');
        }

        const response = await fetch(`${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401 || response.status === 403) {
            console.error('❌ Sessão expirada ou sem permissão');
            authManager.logout();
            throw new Error('Sessão expirada');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Erro na requisição: ${response.status}`);
        }

        return await response.json();
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.vendedorPerfilManager = new VendedorPerfilManager();
});
