/**
 * Gerenciador do Modal de Edição de Clientes (Client Details Page)
 * Controla formulários, validação e integração com APIs
 */
class EditModalManager {
    constructor() {
        this.currentClient = null;
        this.originalData = null;
        this.hasChanges = false;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.initializeElements();
        this.attachEventListeners();
        this.loadStatesData();
    }

    initializeElements() {
        // Modal elements
        this.modal = document.getElementById('editModal');
        this.modalBackdrop = document.getElementById('editModalBackdrop');
        this.closeButton = document.getElementById('closeEditModal');
        this.modalTitle = document.getElementById('editModalTitle');
        this.modalBody = document.getElementById('editModalBody');
        this.form = document.getElementById('editClientForm');

        // Form elements
        this.inputs = {
            name: document.getElementById('editName'),
            type: document.getElementById('editType'),
            cnpj: document.getElementById('editCnpj'),
            phone: document.getElementById('editPhone'),
            state: document.getElementById('editState'),
            city: document.getElementById('editCity'),
            address: document.getElementById('editAddress'),
            notes: document.getElementById('editNotes')
        };

        // Action buttons
        this.saveButton = document.getElementById('saveChanges');
        this.cancelButton = document.getElementById('cancelEdit');
    }

    attachEventListeners() {
        // Close modal events
        [this.closeButton, this.cancelButton, this.modalBackdrop].forEach(element => {
            if (element) {
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleClose();
                });
            }
        });

        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSave();
            });
        }

        // Save button
        if (this.saveButton) {
            this.saveButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSave();
            });
        }

        // State change for cities
        if (this.inputs.state) {
            this.inputs.state.addEventListener('change', () => {
                this.loadCities();
            });
        }
    }

    /**
     * Abre o modal com os dados do cliente
     */
    openModal(client) {
        if (!client) {
            console.error('Cliente não fornecido');
            return;
        }

        this.currentClient = client;
        this.originalData = JSON.parse(JSON.stringify(client));
        
        this.populateForm(client);
        this.showModal();
    }

    /**
     * Popula o formulário com os dados do cliente
     */
    populateForm(client) {
        // Informações básicas
        if (this.inputs.name) this.inputs.name.value = client.name || '';
        if (this.inputs.type) this.inputs.type.value = client.type || '';
        if (this.inputs.cnpj) this.inputs.cnpj.value = client.cnpj || '';
        if (this.inputs.phone) this.inputs.phone.value = client.phone || '';
        if (this.inputs.address) this.inputs.address.value = client.address || '';
        if (this.inputs.notes) this.inputs.notes.value = client.notes || client.observacoes || '';

        // Localização - precisa carregar cidades primeiro
        if (client.state && this.inputs.state) {
            this.inputs.state.value = client.state;
            this.loadCities().then(() => {
                if (this.inputs.city && client.city) {
                    this.inputs.city.value = client.city;
                }
            });
        }
    }

    /**
     * Mostra o modal
     */
    showModal() {
        if (this.modal) {
            this.modal.style.display = 'flex';
        }
        if (this.modalBackdrop) {
            this.modalBackdrop.style.display = 'block';
        }
        if (this.modalBody) {
            this.modalBody.style.display = 'block';
        }
        if (this.modal.querySelector('.modal-content')) {
            this.modal.querySelector('.modal-content').style.display = 'block';
        }
        
        document.body.style.overflow = 'hidden';
        
        // Inicializa ícones Lucide no modal
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Fecha o modal
     */
    handleClose() {
        if (this.hasChanges) {
            if (!confirm('Você tem alterações não salvas. Deseja descartar?')) {
                return;
            }
        }
        this.closeModal();
    }

    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
        if (this.modalBackdrop) {
            this.modalBackdrop.style.display = 'none';
        }
        if (this.modalBody) {
            this.modalBody.style.display = 'none';
        }
        if (this.modal.querySelector('.modal-content')) {
            this.modal.querySelector('.modal-content').style.display = 'none';
        }
        
        document.body.style.overflow = '';
        
        this.currentClient = null;
        this.originalData = null;
        this.hasChanges = false;
        
        if (this.form) {
            this.form.reset();
        }
    }

    /**
     * Salva as alterações
     */
    async handleSave() {
        if (this.isLoading) return;

        try {
            this.isLoading = true;
            this.updateButtonState(true);

            // Coleta dados do formulário
            const formData = {
                nome: this.inputs.name?.value || '',
                tipo: this.inputs.type?.value || '',
                cnpj: this.inputs.cnpj?.value || '',
                telefone: this.inputs.phone?.value || '',
                cidade: this.inputs.city?.value || '',
                uf: this.inputs.state?.value || '',
                observacoes: this.inputs.notes?.value || ''
            };

            // Validação básica
            if (!formData.nome || !formData.tipo) {
                throw new Error('Nome e Tipo são obrigatórios');
            }

            // Chama API para atualizar
            const response = await apiClient.put(`/clientes/${this.currentClient.id}`, formData);

            if (response.success || response.mensagem) {
                this.showToast('Alterações salvas com sucesso!', 'success');
                this.closeModal();
                
                // Recarrega a página para mostrar os dados atualizados
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                throw new Error(response.error || 'Erro ao salvar alterações');
            }

        } catch (error) {
            console.error('Erro ao salvar:', error);
            this.showToast(error.message || 'Erro ao salvar alterações', 'error');
        } finally {
            this.isLoading = false;
            this.updateButtonState(false);
        }
    }

    /**
     * Atualiza estado dos botões
     */
    updateButtonState(loading) {
        if (this.saveButton) {
            this.saveButton.disabled = loading;
            this.saveButton.innerHTML = loading
                ? '<i data-lucide="loader"></i><span>Salvando...</span>'
                : '<i data-lucide="save"></i><span>Salvar Alterações</span>';
            
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Carrega estados do IBGE
     */
    async loadStatesData() {
        if (!this.inputs.state) return;

        try {
            const states = await ibgeApiClient.getEstados();
            
            this.inputs.state.innerHTML = '<option value="">Selecione o estado</option>';
            
            states.forEach(state => {
                const option = document.createElement('option');
                option.value = state.sigla;
                option.textContent = `${state.sigla} - ${state.nome}`;
                this.inputs.state.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar estados:', error);
        }
    }

    /**
     * Carrega cidades do estado selecionado
     */
    async loadCities() {
        const stateCode = this.inputs.state?.value;
        
        if (!stateCode || !this.inputs.city) return;

        try {
            this.inputs.city.innerHTML = '<option value="">Carregando cidades...</option>';
            this.inputs.city.disabled = true;

            const cities = await ibgeApiClient.getMunicipiosPorEstado(stateCode);
            
            this.inputs.city.innerHTML = '<option value="">Selecione a cidade</option>';
            
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.nome;
                option.textContent = city.nome;
                this.inputs.city.appendChild(option);
            });

            this.inputs.city.disabled = false;
        } catch (error) {
            console.error('Erro ao carregar cidades:', error);
            this.inputs.city.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }

    /**
     * Mostra notificação toast
     */
    showToast(message, type = 'info') {
        // Usa o toast manager da página de detalhes se disponível
        if (window.clientDetailsManager && typeof window.clientDetailsManager.showToast === 'function') {
            window.clientDetailsManager.showToast(message, type);
        } else {
            // Fallback: console
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.editModalManager = new EditModalManager();
});
