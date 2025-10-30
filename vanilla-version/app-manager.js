/**
 * Gerenciador da Aplicação Principal
 * Integra autenticação com funcionalidades do sistema
 */
class AppManager {
    constructor() {
        this.currentUser = null;
        this.userPermissions = {};
        this.init();
    }

    init() {
        // Verificar autenticação
        if (!authManager.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        this.currentUser = authManager.getCurrentUser();
        this.userPermissions = authManager.getUserPermissions();
        
        this.setupUserInterface();
        this.setupEventListeners();
        this.initializePermissions();
        this.initializeLucideIcons();
        this.setupSystemStatus();
        
        console.log('Sistema inicializado para:', this.currentUser.nome);
    }

    setupUserInterface() {
        // Mostrar header do usuário
        const userHeader = document.getElementById('userHeader');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');

        if (userHeader && userName && userRole) {
            userName.textContent = this.currentUser.nome;
            userRole.textContent = this.currentUser.perfil;
            userHeader.style.display = 'flex';
        }

        // Atualizar título baseado no departamento
        this.updateSystemTitle();

        // Aplicar tema baseado no nível do usuário
        this.applyUserTheme();
    }

    setupEventListeners() {
        // Logout
        const logoutButton = document.getElementById('logoutButton');
        const logoutFromMenu = document.getElementById('logoutFromMenu');

        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.handleLogout());
        }

        if (logoutFromMenu) {
            logoutFromMenu.addEventListener('click', () => this.handleLogout());
        }

        // Menu do usuário
        const userMenuButton = document.getElementById('userMenuButton');
        const userMenu = document.getElementById('userMenu');

        if (userMenuButton && userMenu) {
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.style.display = userMenu.style.display === 'none' ? 'block' : 'none';
            });

            // Fechar menu ao clicar fora
            document.addEventListener('click', () => {
                userMenu.style.display = 'none';
            });
        }

        // Perfil do usuário
        const userProfile = document.getElementById('userProfile');
        if (userProfile) {
            userProfile.addEventListener('click', () => this.showUserProfile());
        }

        // Estatísticas do usuário
        const userStats = document.getElementById('userStats');
        if (userStats) {
            userStats.addEventListener('click', () => this.showUserStats());
        }

        // Interceptar ações baseadas em permissões
        this.interceptPermissionActions();
    }

    initializePermissions() {
        // Aplicar permissões visuais
        this.applyViewPermissions();
        this.applyActionPermissions();
        this.applyDataPermissions();
    }

    applyViewPermissions() {
        const { canViewAllClients, canViewDepartmentClients, canViewOwnClients } = this.userPermissions;

        // Verificar acesso total aos dados
        if (!canViewAllClients && !canViewDepartmentClients && !canViewOwnClients) {
            this.showAccessDenied();
            return;
        }

        // Ajustar interface baseado em permissões
        if (!canViewAllClients) {
            this.addViewRestrictionIndicator();
        }
    }

    applyActionPermissions() {
        const { canCreate, canEdit, canDelete, canExport } = this.userPermissions;

        // Desabilitar botões baseado em permissões
        if (!canCreate) {
            this.disableCreateActions();
        }

        if (!canEdit) {
            this.disableEditActions();
        }

        if (!canDelete) {
            this.disableDeleteActions();
        }

        if (!canExport) {
            this.disableExportActions();
        }
    }

    applyDataPermissions() {
        // Configurar filtros baseados em permissões
        if (this.userPermissions.canViewDepartmentClients && !this.userPermissions.canViewAllClients) {
            this.setupDepartmentFilter();
        }

        if (this.userPermissions.canViewOwnClients && !this.userPermissions.canViewDepartmentClients) {
            this.setupPersonalFilter();
        }
    }

    updateSystemTitle() {
        const titleElement = document.querySelector('.title');
        if (titleElement) {
            const department = this.currentUser.department;
            if (department && department !== 'Administração') {
                titleElement.textContent = `Sistema de Clientes - ${department}`;
            }
        }
    }

    applyUserTheme() {
        const body = document.body;
        const accessLevel = this.userPermissions.canManageUsers ? 5 : this.userPermissions.canExport ? 4 : this.userPermissions.canEdit ? 3 : this.userPermissions.canCreate ? 2 : 1;

        // Remover classes de tema existentes
        body.classList.remove('theme-admin', 'theme-director', 'theme-manager', 'theme-consultant', 'theme-user');

        // Aplicar tema baseado no nível de acesso
        switch (accessLevel) {
            case 5:
                body.classList.add('theme-admin');
                break;
            case 4:
                body.classList.add('theme-director');
                break;
            case 3:
                body.classList.add('theme-manager');
                break;
            case 2:
                body.classList.add('theme-consultant');
                break;
            default:
                body.classList.add('theme-user');
        }
    }

    setupSystemStatus() {
        const systemStatus = document.getElementById('systemStatus');
        if (systemStatus) {
            // Simular status do sistema
            setInterval(() => {
                this.updateSystemStatus();
            }, 30000); // Atualizar a cada 30 segundos
        }
    }

    updateSystemStatus() {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');

        if (statusIndicator && statusText) {
            // Simular verificação de conectividade
            const isOnline = navigator.onLine;
            
            statusIndicator.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
            statusText.textContent = isOnline ? 'Sistema Online' : 'Sistema Offline';
        }
    }

    handleLogout() {
        const confirmLogout = confirm('Tem certeza que deseja sair do sistema?');
        
        if (confirmLogout) {
            authManager.logout();
            window.location.href = 'login.html';
        }
    }

    showUserProfile() {
        const user = this.currentUser;
        const modal = this.createInfoModal('Meu Perfil', `
            <div class="user-profile-info">
                <div class="profile-section">
                    <h3>Informações Pessoais</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Nome:</label>
                            <span>${user.nome}</span>
                        </div>
                        <div class="info-item">
                            <label>Email:</label>
                            <span>${user.email}</span>
                        </div>
                        <div class="info-item">
                            <label>Perfil:</label>
                            <span>${user.perfil}</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-section">
                    <h3>Acesso ao Sistema</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <label>Nível de Acesso:</label>
                            <span class="access-level-${user.accessLevel}">
                                ${this.getAccessLevelName(user.accessLevel)}
                            </span>
                        </div>
                        <div class="info-item">
                            <label>Status:</label>
                            <span class="status-active">Ativo</span>
                        </div>
                        <div class="info-item">
                            <label>Último Acesso:</label>
                            <span>${new Date().toLocaleString('pt-BR')}</span>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }

    showUserStats() {
        const stats = {
            clientsManaged: 0,
            actionsThisMonth: 0,
            successRate: 0,
            avgResponseTime: 0,
            departmentTeamSize: 0,
            monthlyTarget: 0,
            monthlyProgress: 0
        };
        const modal = this.createInfoModal('Minhas Estatísticas', `
            <div class="user-stats-info">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-number">${stats.clientsManaged}</div>
                        <div class="stat-label">Clientes Gerenciados</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-number">${stats.actionsThisMonth}</div>
                        <div class="stat-label">Ações este Mês</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-number">${stats.successRate}%</div>
                        <div class="stat-label">Taxa de Sucesso</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">⏰</div>
                        <div class="stat-number">${stats.avgResponseTime}h</div>
                        <div class="stat-label">Tempo Médio Resposta</div>
                    </div>
                </div>

                <div class="department-stats">
                    <h3>Estatísticas do Departamento</h3>
                    <div class="department-info">
                        <p><strong>Departamento:</strong> ${this.currentUser.department}</p>
                        <p><strong>Equipe Total:</strong> ${stats.departmentTeamSize} pessoas</p>
                        <p><strong>Meta Mensal:</strong> ${stats.monthlyTarget} ações</p>
                        <p><strong>Progresso:</strong> ${stats.monthlyProgress}%</p>
                    </div>
                </div>
            </div>
        `);
    }

    createInfoModal(title, content) {
        // Criar modal personalizado
        const modalHtml = `
            <div class="info-modal" id="infoModal">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="close-button" id="closeInfoModal">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button class="action-button cancel-button" id="closeInfoModalBtn">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Inserir modal no DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('infoModal');
        const closeBtn = document.getElementById('closeInfoModal');
        const closeBtnFooter = document.getElementById('closeInfoModalBtn');

        // Event listeners
        [closeBtn, closeBtnFooter].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    modal.remove();
                });
            }
        });

        // Fechar ao clicar no backdrop
        modal.querySelector('.modal-backdrop').addEventListener('click', () => {
            modal.remove();
        });

        // Inicializar ícones
        this.initializeLucideIcons();

        return modal;
    }

    getAccessLevelName(level) {
        const levels = {
            5: 'Administrador',
            4: 'Diretor',
            3: 'Gerente',
            2: 'Consultor',
            1: 'Usuário'
        };
        return levels[level] || 'Usuário';
    }

    interceptPermissionActions() {
        // Interceptar tentativas de ações sem permissão
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-permission-required]');
            if (target) {
                const requiredPermission = target.dataset.permissionRequired;
                if (!this.userPermissions[requiredPermission]) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showPermissionDenied(requiredPermission);
                }
            }
        });
    }

    showPermissionDenied(permission) {
        alert(`Acesso negado: Você não tem permissão para ${this.getPermissionDescription(permission)}`);
    }

    getPermissionDescription(permission) {
        const descriptions = {
            'canCreate': 'criar novos registros',
            'canEdit': 'editar registros',
            'canDelete': 'excluir registros',
            'canExport': 'exportar dados',
            'canViewAllClients': 'visualizar todos os clientes',
            'canManageUsers': 'gerenciar usuários'
        };
        return descriptions[permission] || 'realizar esta ação';
    }

    showAccessDenied() {
        document.body.innerHTML = `
            <div class="access-denied">
                <div class="access-denied-content">
                    <i data-lucide="shield-x" class="access-denied-icon"></i>
                    <h1>Acesso Negado</h1>
                    <p>Você não tem permissão para acessar este sistema.</p>
                    <p>Entre em contato com o administrador para solicitar acesso.</p>
                    <button onclick="window.location.href='login.html'" class="back-button">
                        Voltar ao Login
                    </button>
                </div>
            </div>
        `;
        this.initializeLucideIcons();
    }

    initializeLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Métodos auxiliares para aplicar permissões
    disableCreateActions() {
        const createButtons = document.querySelectorAll('[data-action="create"]');
        createButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.title = 'Você não tem permissão para criar';
        });
    }

    disableEditActions() {
        const editButtons = document.querySelectorAll('[data-action="edit"]');
        editButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.title = 'Você não tem permissão para editar';
        });
    }

    disableDeleteActions() {
        const deleteButtons = document.querySelectorAll('[data-action="delete"]');
        deleteButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.title = 'Você não tem permissão para excluir';
        });
    }

    disableExportActions() {
        const exportButtons = document.querySelectorAll('[data-action="export"]');
        exportButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.title = 'Você não tem permissão para exportar';
        });
    }

    addViewRestrictionIndicator() {
        const header = document.querySelector('.title-section');
        if (header) {
            const indicator = document.createElement('div');
            indicator.className = 'view-restriction-indicator';
            indicator.innerHTML = `
                <i data-lucide="eye-off" class="restriction-icon"></i>
                <span>Visualização Restrita</span>
            `;
            header.appendChild(indicator);
        }
    }

    setupDepartmentFilter() {
        // Implementar filtro por departamento
        console.log('Configurando filtro por departamento:', this.currentUser.department);
    }

    setupPersonalFilter() {
        // Implementar filtro pessoal
        console.log('Configurando filtro pessoal para:', this.currentUser.name);
    }
}

// Inicializar gerenciador da aplicação
document.addEventListener('DOMContentLoaded', () => {
    window.appManager = new AppManager();
});