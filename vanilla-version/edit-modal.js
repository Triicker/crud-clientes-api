/**
 * Gerenciador do Modal de Edição de Clientes
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
        this.initializeFormMasks();
        this.loadResponsibleUsers();
        this.loadStatesData();
    }

    initializeElements() {
        // Modal elements
        this.modal = document.getElementById('editModal');
        this.modalBackdrop = document.getElementById('editModalBackdrop');
        this.closeButton = document.getElementById('closeEditModal');
        this.modalTitle = document.getElementById('editModalTitle');
        this.form = document.getElementById('editClientForm');

        // Form elements
        this.inputs = {
            name: document.getElementById('editName'),
            type: document.getElementById('editType'),
            cnpj: document.getElementById('editCnpj'),
            size: document.getElementById('editSize'),
            state: document.getElementById('editState'),
            city: document.getElementById('editCity'),
            microregion: document.getElementById('editMicroregion'),
            address: document.getElementById('editAddress'),
            phone: document.getElementById('editPhone'),
            secondaryPhone: document.getElementById('editSecondaryPhone'),
            email: document.getElementById('editEmail'),
            website: document.getElementById('editWebsite'),
            students: document.getElementById('editStudents'),
            foundedYear: document.getElementById('editFoundedYear'),
            notes: document.getElementById('editNotes'),
            status: document.getElementById('editStatus'),
            responsible: document.getElementById('editResponsible'),
            priority: document.getElementById('editPriority'),
            lastContact: document.getElementById('editLastContact')
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
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });

        // Save button
        this.saveButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSave();
        });

        // State change for cities
        this.inputs.state.addEventListener('change', () => {
            this.loadCities();
        });

        // City change for microregions
        this.inputs.city.addEventListener('change', () => {
            this.loadMicroregions();
        });

        // Track form changes
        Object.values(this.inputs).forEach(input => {
            if (input) {
                ['input', 'change', 'blur'].forEach(event => {
                    input.addEventListener(event, () => {
                        this.trackChanges();
                        this.validateField(input);
                    });
                });
            }
        });

        // Prevent modal close on content click
        this.modal.querySelector('.modal-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.handleClose();
            }
        });
    }

    initializeFormMasks() {
        // CNPJ mask
        if (this.inputs.cnpj) {
            this.inputs.cnpj.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/^(\d{2})(\d)/, '$1.$2');
                value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
                value = value.replace(/(\d{4})(\d)/, '$1-$2');
                e.target.value = value;
            });
            this.inputs.cnpj.placeholder = '00.000.000/0000-00';
        }

        // Phone masks
        [this.inputs.phone, this.inputs.secondaryPhone].forEach(phoneInput => {
            if (phoneInput) {
                phoneInput.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 10) {
                        value = value.replace(/^(\d{2})(\d)/, '($1) $2');
                        value = value.replace(/(\d{4})(\d)/, '$1-$2');
                    } else {
                        value = value.replace(/^(\d{2})(\d)/, '($1) $2');
                        value = value.replace(/(\d{5})(\d)/, '$1-$2');
                    }
                    e.target.value = value;
                });
                phoneInput.placeholder = '(11) 99999-9999';
            }
        });
    }

    async loadResponsibleUsers() {
        if (!this.inputs.responsible) return;

        try {
            // Get users from auth system
            const users = authManager.users || [];
            
            // Clear existing options
            this.inputs.responsible.innerHTML = '<option value="">Selecione o responsável</option>';
            
            // Add users based on permissions
            const currentUser = authManager.getCurrentUser();
            let availableUsers = [];

            if (currentUser?.accessLevel >= 4) {
                // Directors and above can assign to anyone in their department or below
                availableUsers = users.filter(u => 
                    u.department === currentUser.department || 
                    u.accessLevel <= currentUser.accessLevel
                );
            } else if (currentUser?.accessLevel >= 3) {
                // Managers can assign to their team
                availableUsers = users.filter(u => 
                    u.department === currentUser.department && 
                    u.accessLevel <= currentUser.accessLevel
                );
            } else {
                // Others can only assign to themselves
                availableUsers = [currentUser];
            }

            availableUsers.forEach(user => {
                const option = document.createElement('option');
                option.value = user.email;
                option.textContent = `${user.name} (${user.role})`;
                this.inputs.responsible.appendChild(option);
            });

        } catch (error) {
            console.error('Erro ao carregar responsáveis:', error);
        }
    }

    async loadStatesData() {
        if (!this.inputs.state) return;

        try {
            this.setLoading(this.inputs.state, true);
            
            // Use IBGE API if available
            if (window.ibgeAPI) {
                const states = await window.ibgeAPI.getStates();
                this.populateStates(states);
            } else {
                // Fallback to basic states
                this.populateBasicStates();
            }
        } catch (error) {
            console.error('Erro ao carregar estados:', error);
            this.populateBasicStates();
        } finally {
            this.setLoading(this.inputs.state, false);
        }
    }

    populateStates(states) {
        this.inputs.state.innerHTML = '<option value="">Selecione o estado</option>';
        
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state.sigla || state.id;
            option.textContent = state.nome;
            option.dataset.stateId = state.id;
            this.inputs.state.appendChild(option);
        });
    }

    populateBasicStates() {
        const basicStates = [
            { id: '35', sigla: 'SP', nome: 'São Paulo' },
            { id: '33', sigla: 'RJ', nome: 'Rio de Janeiro' },
            { id: '31', sigla: 'MG', nome: 'Minas Gerais' },
            { id: '23', sigla: 'CE', nome: 'Ceará' },
            { id: '29', sigla: 'BA', nome: 'Bahia' }
        ];
        
        this.populateStates(basicStates);
    }

    async loadCities() {
        if (!this.inputs.city || !this.inputs.state.value) return;

        try {
            this.setLoading(this.inputs.city, true);
            this.inputs.city.innerHTML = '<option value="">Carregando cidades...</option>';

            const selectedOption = this.inputs.state.selectedOptions[0];
            const stateId = selectedOption?.dataset.stateId || this.inputs.state.value;

            if (window.ibgeAPI) {
                const cities = await window.ibgeAPI.getCitiesByState(stateId);
                this.populateCities(cities);
            } else {
                // Fallback
                this.inputs.city.innerHTML = '<option value="">Erro ao carregar cidades</option>';
            }
        } catch (error) {
            console.error('Erro ao carregar cidades:', error);
            this.inputs.city.innerHTML = '<option value="">Erro ao carregar cidades</option>';
        } finally {
            this.setLoading(this.inputs.city, false);
        }
    }

    populateCities(cities) {
        this.inputs.city.innerHTML = '<option value="">Selecione a cidade</option>';
        
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.nome;
            option.textContent = city.nome;
            option.dataset.cityId = city.id;
            this.inputs.city.appendChild(option);
        });
    }

    async loadMicroregions() {
        if (!this.inputs.microregion || !this.inputs.city.value) return;

        try {
            this.setLoading(this.inputs.microregion, true);
            this.inputs.microregion.innerHTML = '<option value="">Carregando microrregiões...</option>';

            const selectedOption = this.inputs.city.selectedOptions[0];
            const cityId = selectedOption?.dataset.cityId;

            if (window.ibgeAPI && cityId) {
                const microregions = await window.ibgeAPI.getMicroregionsByCity(cityId);
                this.populateMicroregions(microregions);
            } else {
                this.inputs.microregion.innerHTML = '<option value="">Selecione a microrregião</option>';
            }
        } catch (error) {
            console.error('Erro ao carregar microrregiões:', error);
            this.inputs.microregion.innerHTML = '<option value="">Erro ao carregar microrregiões</option>';
        } finally {
            this.setLoading(this.inputs.microregion, false);
        }
    }

    populateMicroregions(microregions) {
        this.inputs.microregion.innerHTML = '<option value="">Selecione a microrregião</option>';
        
        microregions.forEach(micro => {
            const option = document.createElement('option');
            option.value = micro.nome;
            option.textContent = micro.nome;
            this.inputs.microregion.appendChild(option);
        });
    }

    setLoading(element, loading) {
        if (loading) {
            element.disabled = true;
            element.style.opacity = '0.7';
        } else {
            element.disabled = false;
            element.style.opacity = '1';
        }
    }

    openModal(clientData) {
        this.currentClient = clientData;
        this.originalData = { ...clientData };
        this.hasChanges = false;

        this.populateForm(clientData);
        this.modal.style.display = 'flex';
        
        // Focus first input
        setTimeout(() => {
            this.inputs.name?.focus();
        }, 100);

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    populateForm(data) {
        Object.keys(this.inputs).forEach(key => {
            const input = this.inputs[key];
            if (input && data[key] !== undefined) {
                if (input.type === 'date' && data[key]) {
                    // Format date for input
                    const date = new Date(data[key]);
                    input.value = date.toISOString().split('T')[0];
                } else {
                    input.value = data[key] || '';
                }
            }
        });

        // Update modal title
        this.modalTitle.textContent = `Editar: ${data.name || 'Cliente'}`;
    }

    trackChanges() {
        if (!this.originalData) return;

        this.hasChanges = Object.keys(this.inputs).some(key => {
            const input = this.inputs[key];
            if (!input) return false;

            const currentValue = input.value || '';
            const originalValue = this.originalData[key] || '';
            
            return currentValue !== originalValue;
        });

        this.updateSaveButton();
    }

    updateSaveButton() {
        if (this.saveButton) {
            this.saveButton.disabled = !this.hasChanges || this.isLoading;
            
            if (this.hasChanges && !this.isLoading) {
                this.saveButton.textContent = 'Salvar Alterações';
            } else if (this.isLoading) {
                this.saveButton.textContent = 'Salvando...';
            } else {
                this.saveButton.textContent = 'Sem Alterações';
            }
        }
    }

    validateField(input) {
        const group = input.closest('.form-group');
        if (!group) return true;

        // Remove existing error
        group.classList.remove('has-error');
        const existingError = group.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (input.required && !input.value.trim()) {
            isValid = false;
            errorMessage = 'Este campo é obrigatório';
        }

        // Email validation
        if (input.type === 'email' && input.value && !this.isValidEmail(input.value)) {
            isValid = false;
            errorMessage = 'Digite um email válido';
        }

        // CNPJ validation
        if (input.name === 'cnpj' && input.value && !this.isValidCNPJ(input.value)) {
            isValid = false;
            errorMessage = 'CNPJ inválido';
        }

        // Phone validation
        if (input.type === 'tel' && input.value && input.value.replace(/\D/g, '').length < 10) {
            isValid = false;
            errorMessage = 'Telefone deve ter pelo menos 10 dígitos';
        }

        if (!isValid) {
            group.classList.add('has-error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = errorMessage;
            group.appendChild(errorDiv);
        }

        return isValid;
    }

    validateForm() {
        const requiredInputs = Object.values(this.inputs).filter(input => 
            input && input.required
        );

        let isValid = true;
        
        requiredInputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidCNPJ(cnpj) {
        cnpj = cnpj.replace(/\D/g, '');
        return cnpj.length === 14; // Simplified validation
    }

    async handleSave() {
        if (this.isLoading) return;

        // Validate form
        if (!this.validateForm()) {
            this.showToast('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        try {
            this.setFormLoading(true);

            // Collect form data
            const formData = this.collectFormData();

            // Save via API
            await this.saveClientData(formData);

            // Update local data
            Object.assign(this.currentClient, formData);

            // Update the main table with new data
            this.refreshMainTable(this.currentClient.id, formData);

            // Show success and close modal
            this.showToast('Cliente atualizado com sucesso!', 'success');
            this.closeModal();

        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            this.showToast('Erro ao salvar cliente. Tente novamente.', 'error');
        } finally {
            this.setFormLoading(false);
        }
    }

    collectFormData() {
        const data = {};
        
        Object.keys(this.inputs).forEach(key => {
            const input = this.inputs[key];
            if (input) {
                data[key] = input.value || null;
            }
        });

        // Add metadata
        data.updatedAt = new Date().toISOString();
        data.updatedBy = authManager.getCurrentUser()?.email;

        return data;
    }

    async saveClientData(data) {
        // If API client is available, use it
        if (window.apiClient) {
            return await window.apiClient.updateClient(this.currentClient.id, data);
        }

        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
    }

    setFormLoading(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.form.classList.add('form-loading');
            this.saveButton.disabled = true;
            this.cancelButton.disabled = true;
        } else {
            this.form.classList.remove('form-loading');
            this.updateSaveButton();
            this.cancelButton.disabled = false;
        }
    }

    handleClose() {
        if (this.hasChanges) {
            const confirmClose = confirm(
                'Você tem alterações não salvas. Deseja sair sem salvar?'
            );
            if (!confirmClose) return;
        }

        this.closeModal();
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.currentClient = null;
        this.originalData = null;
        this.hasChanges = false;
        this.isLoading = false;
        
        // Clear form
        this.form.reset();
        
        // Clear validation errors
        document.querySelectorAll('.form-group.has-error').forEach(group => {
            group.classList.remove('has-error');
            const error = group.querySelector('.error-message');
            if (error) error.remove();
        });
    }

    isOpen() {
        return this.modal && this.modal.style.display !== 'none';
    }

    showToast(message, type = 'info') {
        // Use existing toast system if available
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }

        // Simple fallback
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Atualiza a tabela principal após alterações
     */
    refreshMainTable(clientId, updatedData) {
        // Usar a instância global do ClientManager
        if (window.clientManager && window.clientManager.updateClient) {
            window.clientManager.updateClient(clientId, updatedData);
        }
    }
}

// Initialize edit modal manager
document.addEventListener('DOMContentLoaded', () => {
    window.editModalManager = new EditModalManager();
});

// Export for use in other scripts
window.EditModalManager = EditModalManager;