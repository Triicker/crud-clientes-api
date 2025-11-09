// ============================================================================
// SISTEMA DE GERENCIAMENTO DE CLIENTES - JAVASCRIPT VANILLA
// ============================================================================

/**
 * Definições de tipos de cliente
 */
const clientTypes = {
    school: 'Escola',
    network: 'Rede de Ensino'
};

class ClientManager {
    constructor() {
        this.clients = [];
        this.filteredClients = [];
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
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeLucideIcons();
        // A inicialização dos dados agora é chamada após a verificação de autenticação
    }

    /**
     * Inicializa as referências dos elementos DOM
     */
    initializeElements() {
        // Search and filters
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearch');
        this.stateFilterSelect = document.getElementById('stateFilter');
        this.cityFilterSelect = document.getElementById('cityFilter');
        this.microregionFilterSelect = document.getElementById('microregionFilter');
        this.typeFilterSelect = document.getElementById('typeFilter');
        this.resetFiltersBtn = document.getElementById('resetFilters');
        this.addClientBtn = document.getElementById('addClientButton');
        
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
            this.applyFilters();
        });
        
        this.cityFilterSelect.addEventListener('change', () => {
            this.cityFilter = this.cityFilterSelect.value;
            this.applyFilters();
        });
        
        this.microregionFilterSelect.addEventListener('change', () => {
            this.microregionFilter = this.microregionFilterSelect.value;
            this.applyFilters();
        });
        
        this.typeFilterSelect.addEventListener('change', () => {
            this.typeFilter = this.typeFilterSelect.value;
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
        this.currentPage = page;
        if (this.apiAvailable) {
            this.loadClientsFromAPI(page);
        } else {
            let tempClients = [...this.clients];
            if (this.searchTerm) {
                tempClients = tempClients.filter(client => this.matchesSearchTerm(client, this.searchTerm));
            }
            if (this.stateFilter) {
                tempClients = tempClients.filter(client => client.uf === this.stateFilter);
            }
            if (this.cityFilter) {
                tempClients = tempClients.filter(client => client.cidade === this.cityFilter);
            }
            if (this.typeFilter) {
                tempClients = tempClients.filter(client => client.tipo === this.typeFilter);
            }
            this.filteredClients = tempClients;
            this.renderTable();
            this.renderPagination();
        }
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
        const searchFields = [client.nome, client.observacoes, client.telefone, client.cnpj, client.cidade, client.uf];
        return searchFields.some(field => field && field.toLowerCase().includes(term));
    }

    /**
     * Manipula a ordenação da tabela
     */
    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
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
            if (button.dataset.column === this.sortColumn) {
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
        return `
            <tr class="client-row" data-client-id="${client.id}" tabindex="0" role="button" aria-label="Selecionar cliente ${client.nome}">
                <td class="client-name">${this.escapeHtml(client.nome)}</td>
                <td class="client-address">${this.escapeHtml(client.observacoes)}</td>
                <td class="client-phone">${this.escapeHtml(client.telefone)}</td>
                <td class="client-cnpj">${this.escapeHtml(client.cnpj)}</td>
                <td class="client-city">${this.escapeHtml(client.cidade)}</td>
                <td class="client-state">${this.escapeHtml(client.uf)}</td>
                <td>
                    <div class="actions-container">
                        <button class="action-btn btn-view" data-action="view" data-client-id="${client.id}" title="Ver detalhes" aria-label="Ver detalhes de ${client.nome}"><i data-lucide="eye"></i></button>
                        <button class="action-btn btn-edit" data-action="edit" data-client-id="${client.id}" title="Editar cliente" aria-label="Editar ${client.nome}"><i data-lucide="edit"></i></button>
                        <button class="action-btn btn-delete" data-action="delete" data-client-id="${client.id}" title="Excluir cliente" aria-label="Excluir ${client.nome}"><i data-lucide="trash-2"></i></button>
                        <button class="action-btn btn-more" data-action="more" data-client-id="${client.id}" title="Mais opções" aria-label="Mais opções para ${client.nome}"><i data-lucide="more-horizontal"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Anexa event listeners para as linhas da tabela
     */
    attachRowEventListeners() {
        document.querySelectorAll('.client-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (!e.target.closest('.action-btn')) {
                    this.showClientDetails(row.dataset.clientId);
                }
            });
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showClientDetails(row.dataset.clientId);
                }
            });
        });
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const { action, clientId } = e.currentTarget.dataset;
                this.handleClientAction(action, clientId);
            });
        });
    }

    /**
     * Manipula ações do cliente
     */
    handleClientAction(action, clientId) {
        const client = this.clients.find(c => c.id.toString() === clientId);
        if (!client) return;
        switch (action) {
            case 'view':
                this.showClientDetails(clientId);
                break;
            case 'edit':
                this.openEditModal(client);
                break;
            case 'delete':
                this.confirmDeleteClient(clientId);
                break;
            case 'more':
                this.showToast('info', `Mais opções para: ${client.nome}`);
                break;
        }
    }

    /**
     * Abre o modal de edição
     */
    openEditModal(client) {
        console.log('openEditModal chamado, client:', client);
        console.log('canEditClient resultado:', this.canEditClient(client));
        
        if (!this.canEditClient(client)) {
            this.showToast('error', 'Você não tem permissão para editar este cliente');
            return;
        }
        
        console.log('window.editModalManager existe?', !!window.editModalManager);
        if (window.editModalManager) {
            window.editModalManager.openModal(client);
        } else {
            console.error('Edit Modal Manager não encontrado');
            this.showToast('error', 'Sistema de edição não disponível');
        }
    }

    /**
     * Abre o modal para adicionar novo cliente
     */
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
    canEditClient(client) {
        // Se não há sistema de autenticação ativo, permite edição
        if (!window.authManager) return true;
        if (!window.authManager.isAuthenticated()) return true;
        
        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser) return true;
        
        const permissions = window.authManager.getUserPermissions();
        if (!permissions) return true;
        
        if (permissions.canEdit && permissions.canViewAllClients) return true;
        if (permissions.canEdit && permissions.canViewDepartmentClients) return true; // Lógica de departamento a ser implementada
        if (permissions.canEdit && permissions.canViewOwnClients) return client.responsible === currentUser.email;
        return false;
    }

    /**
     * Confirma exclusão do cliente
     */
    confirmDeleteClient(clientId) {
        const client = this.clients.find(c => c.id.toString() === clientId);
        if (!client) return;
        if (confirm(`Tem certeza que deseja excluir o cliente "${client.nome}"?`)) {
            this.showToast('info', 'Funcionalidade de exclusão ainda não implementada.');
        }
    }

    /**
     * Redireciona para a página de detalhes do cliente
     */
    showClientDetails(clientId) {
        window.location.href = `client-details.html?id=${clientId}`;
    }

    renderPagination() {
        const totalItems = this.filteredClients.length;
        if (totalItems === 0) {
            this.paginationSection.style.display = 'none';
            return;
        }
        this.paginationSection.style.display = 'flex';
        const totalPages = this.getTotalPages();
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, totalItems);
        this.paginationInfo.textContent = `Mostrando ${startItem} a ${endItem} de ${totalItems} registros`;
        this.firstPageBtn.disabled = this.currentPage === 1;
        this.prevPageBtn.disabled = this.currentPage === 1;
        this.nextPageBtn.disabled = this.currentPage === totalPages;
        this.lastPageBtn.disabled = this.currentPage === totalPages;
        this.renderPageNumbers(totalPages);
    }

    renderPageNumbers(totalPages) {
        this.pageNumbers.innerHTML = '';
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                this.pageNumbers.appendChild(this.createPageButton(i));
            }
        } else {
            const current = this.currentPage;
            this.pageNumbers.appendChild(this.createPageButton(1));
            if (current > 3) {
                this.pageNumbers.appendChild(this.createEllipsis());
            }
            const start = Math.max(2, current - 1);
            const end = Math.min(totalPages - 1, current + 1);
            for (let i = start; i <= end; i++) {
                this.pageNumbers.appendChild(this.createPageButton(i));
            }
            if (current < totalPages - 2) {
                this.pageNumbers.appendChild(this.createEllipsis());
            }
            if (totalPages > 1) {
                this.pageNumbers.appendChild(this.createPageButton(totalPages));
            }
        }
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
        if (filtered === total) {
            this.resultsCount.textContent = `${filtered} clientes encontrados`;
        } else {
            this.resultsCount.textContent = `${filtered} de ${total} clientes encontrados`;
        }
        this.totalCount.textContent = '';
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
    const userMenuButton = document.getElementById('userMenuButton');
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
    
    // Toggle do menu do usuário
    if (userMenuButton && userMenu) {
        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.style.display = userMenu.style.display === 'none' ? 'block' : 'none';
        });
        
        // Fechar menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (!userMenuButton.contains(e.target) && !userMenu.contains(e.target)) {
                userMenu.style.display = 'none';
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