class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.etapasConfig = null;
        this.loadSession();
    }

    loadSession() {
        const userData = localStorage.getItem('currentUser');
        const token = localStorage.getItem('token');

        if (userData && token) {
            try {
                this.currentUser = JSON.parse(userData);
                this.token = token;
            } catch (error) {
                console.error('Erro ao carregar sessão:', error);
                this.logout();
            }
        }
    }

    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }

    // Verifica se o usuário é administrador (perfil_id = 1)
    isAdmin() {
        return this.currentUser && this.currentUser.perfil_id === 1;
    }

    // Obtém o perfil_id do usuário atual
    getPerfilId() {
        return this.currentUser ? this.currentUser.perfil_id : null;
    }

    // Obtém o ID do usuário atual
    getUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }

    // Carrega configuração das etapas do backend
    async loadEtapasConfig() {
        if (this.etapasConfig) return this.etapasConfig;
        
        try {
            const response = await fetch('/api/liberacao/etapas', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                this.etapasConfig = data.etapas;
                return this.etapasConfig;
            }
        } catch (error) {
            console.error('Erro ao carregar config de etapas:', error);
        }
        return [];
    }

    // Verifica se pode avançar para uma etapa
    async podeAvancarEtapa(clienteId, etapaDestino) {
        // Administrador pode sempre
        if (this.isAdmin()) {
            return { pode: true, motivo: 'Administrador' };
        }

        try {
            const response = await fetch(`/api/liberacao/verificar/${clienteId}/${etapaDestino}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Erro ao verificar permissão:', error);
        }
        return { pode: false, motivo: 'Erro ao verificar' };
    }

    getUserPermissions() {
        if (!this.currentUser) {
            return {};
        }

        // Mapear perfil_id para permissões
        const perfilId = this.currentUser.perfil_id;
        const permissions = {
            canViewAllClients: false,
            canViewDepartmentClients: false,
            canViewOwnClients: false,
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canExport: false,
            canManageUsers: false,
            canApproveLiberacao: false,
            canAdvanceWithoutApproval: false
        };

        switch (perfilId) {
            case 1: // administrador
                permissions.canViewAllClients = true;
                permissions.canCreate = true;
                permissions.canEdit = true;
                permissions.canDelete = true;
                permissions.canExport = true;
                permissions.canManageUsers = true;
                permissions.canApproveLiberacao = true;
                permissions.canAdvanceWithoutApproval = true;
                break;
            case 2: // consultor
                permissions.canViewOwnClients = true;
                permissions.canCreate = true;
                permissions.canEdit = true;
                break;
            case 3: // representante
                permissions.canViewOwnClients = true;
                permissions.canCreate = true;
                permissions.canEdit = true;
                break;
            case 4: // equipe_interna
                permissions.canViewDepartmentClients = true;
                permissions.canCreate = true;
                permissions.canEdit = true;
                break;
            case 5: // equipe_externa
                permissions.canViewDepartmentClients = true;
                permissions.canEdit = true;
                break;
            case 6: // diretor_comercial
                permissions.canViewAllClients = true;
                permissions.canCreate = true;
                permissions.canEdit = true;
                permissions.canDelete = true;
                permissions.canExport = true;
                permissions.canApproveLiberacao = true;
                break;
            case 7: // logistica
                permissions.canViewDepartmentClients = true;
                permissions.canEdit = true;
                break;
            case 8: // formadores
                permissions.canViewDepartmentClients = true;
                permissions.canEdit = true;
                break;
            case 9: // marketing
                permissions.canViewDepartmentClients = true;
                permissions.canEdit = true;
                permissions.canExport = true;
                break;
            case 10: // gerencia_dados
                permissions.canViewAllClients = true;
                permissions.canEdit = true;
                permissions.canExport = true;
                break;
            default:
                permissions.canViewOwnClients = true;
                break;
        }

        return permissions;
    }

    logout() {
        this.currentUser = null;
        this.token = null;
        this.etapasConfig = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
    }

    // ===== SISTEMA DE LIBERAÇÃO DE ETAPAS =====
    
    // Mapeamento de etapas na ordem do fluxo
    getEtapasOrdem() {
        return [
            'prospeccao',
            'aumentar_conexao', 
            'envio_consultor',
            'efetivacao',
            'registros_legais',
            'separacao',
            'entrega',
            'recebimentos',
            'formacao',
            'documentarios',
            'gerar_graficos',
            'renovacao'
        ];
    }

    // Verifica se o usuário tem acesso a uma etapa específica
    async verificarAcessoEtapa(etapaId, clienteId) {
        // Administrador sempre tem acesso
        if (this.isAdmin()) {
            return true;
        }

        const etapasOrdem = this.getEtapasOrdem();
        const idxEtapa = etapasOrdem.indexOf(etapaId);
        
        // Primeira etapa sempre liberada
        if (idxEtapa === 0) {
            return true;
        }

        try {
            // Verifica no backend se há liberação aprovada
            const response = await fetch(`/api/liberacao/status/${clienteId}/${etapaId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Se já tem liberação aprovada, pode acessar
                if (data.liberado) {
                    return true;
                }
                
                // Se etapa anterior está completa, pode acessar
                if (data.etapa_anterior_completa) {
                    return true;
                }
            }
        } catch (error) {
            console.error('Erro ao verificar acesso à etapa:', error);
        }
        
        return false;
    }

    // Solicita liberação para acessar uma etapa
    async solicitarLiberacao(clienteId, etapaAtual, etapaDestino) {
        try {
            const response = await fetch('/api/liberacao/solicitar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    cliente_id: clienteId,
                    etapa_atual: etapaAtual,
                    etapa_destino: etapaDestino
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao solicitar liberação');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao solicitar liberação:', error);
            throw error;
        }
    }

    // Obtém liberações pendentes (para admins/supervisores)
    async getLiberacoesPendentes() {
        try {
            const response = await fetch('/api/liberacao/pendentes', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Erro ao buscar liberações pendentes:', error);
        }
        return [];
    }

    // Aprova uma solicitação de liberação
    async aprovarLiberacao(liberacaoId, observacao = '') {
        try {
            const response = await fetch(`/api/liberacao/${liberacaoId}/aprovar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ observacao })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao aprovar liberação');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao aprovar liberação:', error);
            throw error;
        }
    }

    // Rejeita uma solicitação de liberação
    async rejeitarLiberacao(liberacaoId, observacao = '') {
        try {
            const response = await fetch(`/api/liberacao/${liberacaoId}/rejeitar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ observacao })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao rejeitar liberação');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro ao rejeitar liberação:', error);
            throw error;
        }
    }
}

const authManager = new AuthManager();
window.authManager = authManager;