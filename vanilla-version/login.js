// ============================================================================
// SISTEMA DE LOGIN - JAVASCRIPT
// ============================================================================

class LoginManager {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.initializeLucideIcons();
    }

    /**
     * Inicializa as referências dos elementos DOM
     */
    initializeElements() {
        this.loginForm = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = document.getElementById('loginBtn');
    }

    /**
     * Anexa os event listeners
     */
    attachEventListeners() {
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    /**
     * Manipula o processo de login
     */
    async handleLogin() {
        const email = this.emailInput.value.trim();
        const senha = this.passwordInput.value.trim();

        if (!email || !senha) {
            this.showToast('Por favor, preencha todos os campos', 'error');
            return;
        }

        this.loginBtn.disabled = true;
        this.loginBtn.innerHTML = '<i data-lucide="loader"></i> Entrando...';
        this.initializeLucideIcons();

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, senha })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Formato novo: { success: true, data: { token, usuario }, message }
                const { token, usuario } = result.data;
                localStorage.setItem('currentUser', JSON.stringify(usuario));
                localStorage.setItem('token', token);
                this.showToast(result.message || 'Login realizado com sucesso', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.showToast(result.message || 'Credenciais inválidas', 'error');
                this.loginBtn.disabled = false;
                this.loginBtn.innerHTML = '<i data-lucide="log-in"></i> Entrar no Sistema';
                this.initializeLucideIcons();
            }
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            this.showToast('Erro de conexão com o servidor.', 'error');
            this.loginBtn.disabled = false;
            this.loginBtn.innerHTML = '<i data-lucide="log-in"></i> Entrar no Sistema';
            this.initializeLucideIcons();
        }
    }

    /**
     * Mostra notificação toast
     */
    showToast(message, type = 'info') {
        // Criar elemento toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}"></i>
            <span>${message}</span>
        `;
        
        // Adicionar estilos
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 1000;
            font-size: 14px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Inicializar ícones do Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Animar entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover após delay
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    /**
     * Inicializa os ícones do Lucide
     */
    initializeLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

let loginManager;

document.addEventListener('DOMContentLoaded', () => {
    loginManager = new LoginManager();
});