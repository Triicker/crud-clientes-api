class AuthManager {
    constructor() {
        this.currentUser = null;
        this.token = null;
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

    getUserPermissions() {
        if (!this.currentUser) {
            return {};
        }

        // Mapear perfil para permissões
        const profile = this.currentUser.perfil.toLowerCase();
        const permissions = {
            canViewAllClients: false,
            canViewDepartmentClients: false,
            canViewOwnClients: false,
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canExport: false,
            canManageUsers: false
        };

        switch (profile) {
            case 'administrador':
                permissions.canViewAllClients = true;
                permissions.canCreate = true;
                permissions.canEdit = true;
                permissions.canDelete = true;
                permissions.canExport = true;
                permissions.canManageUsers = true;
                break;
            case 'diretor':
                permissions.canViewAllClients = true;
                permissions.canCreate = true;
                permissions.canEdit = true;
                permissions.canDelete = true;
                permissions.canExport = true;
                break;
            case 'gerente':
                permissions.canViewDepartmentClients = true;
                permissions.canCreate = true;
                permissions.canEdit = true;
                permissions.canExport = true;
                break;
            case 'consultor':
                permissions.canViewOwnClients = true;
                permissions.canCreate = true;
                permissions.canEdit = true;
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
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
    }
}

const authManager = new AuthManager();
window.authManager = authManager;