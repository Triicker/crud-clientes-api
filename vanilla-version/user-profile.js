/**
 * Gerenciamento da página de perfil do usuário
 */

class UserProfile {
    constructor() {
        this.userId = null;
        this.userData = null;
        this.init();
    }

    async init() {
        // Verificar autenticação
        if (!window.authManager.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        this.userId = window.authManager.getUserId();
        await this.loadUserData();
        await this.loadUserStats();
        await this.loadRecentActivities();
        this.setupEventListeners();
        this.initializeLucideIcons();
    }

    async loadUserData() {
        try {
            const response = await apiClient.get(`/usuarios/${this.userId}`);
            
            if (response.success && response.data) {
                this.userData = response.data.usuario;
                this.displayUserData();
            } else if (response.data && response.data.nome) {
                // Formato alternativo de resposta
                this.userData = response.data;
                this.displayUserData();
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            this.showToast('error', 'Erro ao carregar dados do perfil');
        }
    }

    displayUserData() {
        const user = this.userData;
        
        // Informações do perfil
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileRole = document.getElementById('profileRole');
        const profilePhone = document.getElementById('profilePhone');
        
        if (profileName) profileName.textContent = user.nome || '-';
        if (profileEmail) profileEmail.textContent = user.email || '-';
        if (profileRole) profileRole.textContent = user.perfil_nome || '-';
        if (profilePhone) profilePhone.textContent = user.telefone || 'Não informado';
        
        // Data de admissão
        if (user.data_admissao) {
            const date = new Date(user.data_admissao);
            document.getElementById('profileAdmissionDate').textContent = date.toLocaleDateString('pt-BR');
        }
        
        // Status
        const statusBadge = user.ativo ? 
            '<span class="status-badge status-active">Ativo</span>' :
            '<span class="status-badge status-inactive">Inativo</span>';
        document.getElementById('profileStatus').innerHTML = statusBadge;
        
        // Observações
        if (user.observacao_geral && user.observacao_geral.trim()) {
            document.getElementById('profileObservation').textContent = user.observacao_geral;
            document.getElementById('profileObservationContainer').style.display = 'block';
        }
    }

    async loadUserStats() {
        try {
            // Buscar estatísticas do usuário
            const stats = {
                clientes: 0,
                tarefas: 0,
                interacoes: 0,
                meta: this.userData?.meta_vendas_mensal || 0
            };

            // Se for vendedor, buscar clientes atribuídos
            const clientesResponse = await apiClient.get('/clientes', { 
                vendedor_id: this.userId,
                status: 'active',
                limit: 1000
            });
            
            if (clientesResponse.success && clientesResponse.data) {
                stats.clientes = clientesResponse.data.length;
            }

            // Buscar interações (se existir endpoint)
            try {
                const interacoesResponse = await apiClient.get(`/interacoes/usuario/${this.userId}`);
                if (interacoesResponse.data) {
                    stats.interacoes = interacoesResponse.data.length || 0;
                }
            } catch (e) {
                console.log('Endpoint de interações não disponível');
            }

            // Buscar tarefas concluídas
            try {
                const tarefasResponse = await apiClient.get(`/tarefas/usuario/${this.userId}`);
                if (tarefasResponse.data) {
                    stats.tarefas = tarefasResponse.data.filter(t => t.concluida).length || 0;
                }
            } catch (e) {
                console.log('Endpoint de tarefas não disponível');
            }

            this.displayStats(stats);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    displayStats(stats) {
        document.getElementById('statClientes').textContent = stats.clientes;
        document.getElementById('statTarefas').textContent = stats.tarefas;
        document.getElementById('statInteracoes').textContent = stats.interacoes;
        document.getElementById('statMeta').textContent = stats.meta;
    }

    async loadRecentActivities() {
        try {
            const container = document.getElementById('recentActivities');
            
            // Buscar interações recentes
            const interacoesResponse = await apiClient.get(`/interacoes/usuario/${this.userId}`);
            
            if (interacoesResponse.data && interacoesResponse.data.length > 0) {
                const activities = interacoesResponse.data.slice(0, 10); // Últimas 10
                container.innerHTML = activities.map(activity => `
                    <div class="activity-item">
                        <i data-lucide="message-circle" class="activity-icon"></i>
                        <div class="activity-content">
                            <p class="activity-title">${activity.tipo || 'Interação'}</p>
                            <p class="activity-description">${activity.descricao || 'Sem descrição'}</p>
                            <span class="activity-date">${new Date(activity.data_interacao).toLocaleString('pt-BR')}</span>
                        </div>
                    </div>
                `).join('');
                
                this.initializeLucideIcons();
            }
        } catch (error) {
            console.log('Atividades recentes não disponíveis');
        }
    }

    setupEventListeners() {
        // Botão de voltar
        document.getElementById('backButton')?.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Botão de logout
        document.getElementById('logoutButton')?.addEventListener('click', () => {
            window.authManager.logout();
        });

        // Botão de editar perfil (edição inline)
        document.getElementById('editProfileButton')?.addEventListener('click', () => {
            this.enableInlineEdit();
        });

        // Botão de salvar (edição inline)
        document.getElementById('saveProfileButton')?.addEventListener('click', () => {
            this.saveInlineEdit();
        });

        // Botão de cancelar (edição inline)
        document.getElementById('cancelEditButton')?.addEventListener('click', () => {
            this.cancelInlineEdit();
        });

        // Fechar modal
        document.getElementById('closeEditModal')?.addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('cancelEditProfile')?.addEventListener('click', () => {
            this.closeEditModal();
        });

        // Clicar fora do modal
        document.getElementById('editProfileModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'editProfileModal') {
                this.closeEditModal();
            }
        });

        // Submit do formulário
        document.getElementById('editProfileForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });
    }

    enableInlineEdit() {
        // Mostrar inputs e ocultar valores
        const nameInput = document.getElementById('profileNameInput');
        const emailInput = document.getElementById('profileEmailInput');
        const phoneInput = document.getElementById('profilePhoneInput');
        const observationInput = document.getElementById('profileObservationInput');
        
        // Preencher inputs com valores atuais
        nameInput.value = this.userData.nome || '';
        emailInput.value = this.userData.email || '';
        phoneInput.value = this.userData.telefone || '';
        observationInput.value = this.userData.observacao_geral || '';
        
        // Alternar visibilidade
        document.getElementById('profileName').style.display = 'none';
        document.getElementById('profileEmail').style.display = 'none';
        document.getElementById('profilePhone').style.display = 'none';
        document.getElementById('profileObservation').style.display = 'none';
        
        nameInput.style.display = 'block';
        emailInput.style.display = 'block';
        phoneInput.style.display = 'block';
        if (this.userData.observacao_geral) {
            observationInput.style.display = 'block';
        }
        
        // Alternar botões
        document.getElementById('editProfileButton').style.display = 'none';
        document.getElementById('saveProfileButton').style.display = 'inline-flex';
        document.getElementById('cancelEditButton').style.display = 'inline-flex';
        
        this.initializeLucideIcons();
    }

    cancelInlineEdit() {
        // Ocultar inputs e mostrar valores
        document.getElementById('profileName').style.display = 'block';
        document.getElementById('profileEmail').style.display = 'block';
        document.getElementById('profilePhone').style.display = 'block';
        document.getElementById('profileObservation').style.display = 'block';
        
        document.getElementById('profileNameInput').style.display = 'none';
        document.getElementById('profileEmailInput').style.display = 'none';
        document.getElementById('profilePhoneInput').style.display = 'none';
        document.getElementById('profileObservationInput').style.display = 'none';
        
        // Alternar botões
        document.getElementById('editProfileButton').style.display = 'inline-flex';
        document.getElementById('saveProfileButton').style.display = 'none';
        document.getElementById('cancelEditButton').style.display = 'none';
    }

    async saveInlineEdit() {
        const nome = document.getElementById('profileNameInput').value.trim();
        const email = document.getElementById('profileEmailInput').value.trim();
        const telefone = document.getElementById('profilePhoneInput').value.trim();
        const observacao_geral = document.getElementById('profileObservationInput').value.trim();

        // Validações
        if (!nome || !email) {
            this.showToast('error', 'Nome e email são obrigatórios');
            return;
        }

        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showToast('error', 'Email inválido');
            return;
        }

        try {
            const updateData = {
                nome,
                email,
                telefone,
                observacao_geral,
                perfil_id: this.userData.perfil_id
            };

            const response = await apiClient.put(`/usuarios/${this.userId}`, updateData);

            if (response.mensagem || response.success) {
                this.showToast('success', 'Perfil atualizado com sucesso!');
                this.cancelInlineEdit();
                await this.loadUserData();
            }
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            this.showToast('error', `Erro ao atualizar perfil: ${error.message}`);
        }
    }

    openEditModal() {
        const modal = document.getElementById('editProfileModal');
        
        // Preencher formulário com dados atuais
        document.getElementById('editName').value = this.userData.nome || '';
        document.getElementById('editEmail').value = this.userData.email || '';
        document.getElementById('editPhone').value = this.userData.telefone || '';
        document.getElementById('editObservation').value = this.userData.observacao_geral || '';
        
        modal.style.display = 'flex';
        this.initializeLucideIcons();
    }

    closeEditModal() {
        const modal = document.getElementById('editProfileModal');
        modal.style.display = 'none';
        
        // Limpar campos de senha
        document.getElementById('editPassword').value = '';
        document.getElementById('editPasswordConfirm').value = '';
    }

    async saveProfile() {
        const nome = document.getElementById('editName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const telefone = document.getElementById('editPhone').value.trim();
        const observacao_geral = document.getElementById('editObservation').value.trim();
        const senha = document.getElementById('editPassword').value;
        const senhaConfirm = document.getElementById('editPasswordConfirm').value;

        // Validações
        if (!nome || !email) {
            this.showToast('error', 'Nome e email são obrigatórios');
            return;
        }

        if (senha && senha !== senhaConfirm) {
            this.showToast('error', 'As senhas não coincidem');
            return;
        }

        if (senha && senha.length < 6) {
            this.showToast('error', 'A senha deve ter no mínimo 6 caracteres');
            return;
        }

        try {
            const updateData = {
                nome,
                email,
                telefone,
                observacao_geral,
                perfil_id: this.userData.perfil_id
            };

            if (senha) {
                updateData.senha = senha;
            }

            const response = await apiClient.put(`/usuarios/${this.userId}`, updateData);

            if (response.mensagem || response.success) {
                this.showToast('success', 'Perfil atualizado com sucesso!');
                this.closeEditModal();
                await this.loadUserData();
            }
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            this.showToast('error', `Erro ao atualizar perfil: ${error.message}`);
        }
    }

    showToast(type, message) {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 'x-circle';
        toast.innerHTML = `
            <i data-lucide="${icon}" class="toast-icon"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Inicializar ícone
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Remover após 3 segundos
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    initializeLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new UserProfile();
});
