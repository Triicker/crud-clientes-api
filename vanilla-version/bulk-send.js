// ============================================================================
// SISTEMA DE ENVIO EM MASSA - BULK SEND
// ============================================================================

class BulkSendManager {
    constructor() {
        this.selectedClients = new Set();
        this.currentStep = 1;
        this.sendType = '';
        this.currentClient = null;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // Checkboxes
        this.selectAllCheckbox = document.getElementById('selectAllCheckbox');
        
        // Botões principais
        this.bulkSendButton = document.getElementById('bulkSendButton');
        this.bulkSendFloatingBtn = document.getElementById('bulkSendFloatingBtn');
        this.selectedCountBadge = document.getElementById('selectedCountBadge');
        
        // Modal de Bulk Send
        this.bulkSendModal = document.getElementById('bulkSendModal');
        this.closeBulkSendModal = document.getElementById('closeBulkSendModal');
        
        // Wizard
        this.wizardBackBtn = document.getElementById('wizardBackBtn');
        this.wizardNextBtn = document.getElementById('wizardNextBtn');
        this.wizardStep1 = document.getElementById('wizardStep1');
        this.wizardStep2 = document.getElementById('wizardStep2');
        this.wizardStep3 = document.getElementById('wizardStep3');
        
        // Step 1 - Tipo de envio
        this.sendTypeCards = document.querySelectorAll('.send-type-card');
        
        // Step 2 - Seleção de contatos
        this.selectAllWizard = document.getElementById('selectAllWizard');
        this.contactsList = document.getElementById('contactsList');
        
        // Step 3 - Confirmação
        this.summaryType = document.getElementById('summaryType');
        this.summaryRecipients = document.getElementById('summaryRecipients');
        this.messageInputArea = document.getElementById('messageInputArea');
        this.fileUploadArea = document.getElementById('fileUploadArea');
        this.bulkMessageText = document.getElementById('bulkMessageText');
        this.bulkFileInput = document.getElementById('bulkFileInput');
        
        // Modais de envio rápido
        this.quickWhatsAppModal = document.getElementById('quickWhatsAppModal');
        this.quickEmailModal = document.getElementById('quickEmailModal');
        this.quickDocumentModal = document.getElementById('quickDocumentModal');
        
        // Botões de fechar dos modais rápidos
        this.closeWhatsAppModal = document.getElementById('closeWhatsAppModal');
        this.closeEmailModal = document.getElementById('closeEmailModal');
        this.closeDocumentModal = document.getElementById('closeDocumentModal');
        
        // Botões de cancelar
        this.cancelWhatsAppSend = document.getElementById('cancelWhatsAppSend');
        this.cancelEmailSend = document.getElementById('cancelEmailSend');
        this.cancelDocumentSend = document.getElementById('cancelDocumentSend');
        
        // Botões de confirmar envio
        this.confirmWhatsAppSend = document.getElementById('confirmWhatsAppSend');
        this.confirmEmailSend = document.getElementById('confirmEmailSend');
        this.confirmDocumentSend = document.getElementById('confirmDocumentSend');
    }

    attachEventListeners() {
        // Select All
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.addEventListener('change', (e) => this.handleSelectAll(e));
        }
        
        // Botão principal de envio em massa
        if (this.bulkSendButton) {
            this.bulkSendButton.addEventListener('click', () => this.openBulkSendModal());
        }
        
        // Botão flutuante mobile
        if (this.bulkSendFloatingBtn) {
            this.bulkSendFloatingBtn.addEventListener('click', () => this.openBulkSendModal());
        }
        
        // Fechar modal
        if (this.closeBulkSendModal) {
            this.closeBulkSendModal.addEventListener('click', () => this.closeBulkModal());
        }
        
        // Backdrop
        const backdrop = this.bulkSendModal?.querySelector('.bulk-send-modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeBulkModal());
        }
        
        // Wizard navigation
        if (this.wizardBackBtn) {
            this.wizardBackBtn.addEventListener('click', () => this.previousStep());
        }
        
        if (this.wizardNextBtn) {
            this.wizardNextBtn.addEventListener('click', () => this.nextStep());
        }
        
        // Step 1 - Seleção de tipo
        this.sendTypeCards.forEach(card => {
            card.addEventListener('click', () => this.selectSendType(card));
        });
        
        // Step 2 - Select all wizard
        if (this.selectAllWizard) {
            this.selectAllWizard.addEventListener('change', (e) => this.handleSelectAllWizard(e));
        }
        
        // Modais de envio rápido
        this.attachQuickSendListeners();
    }

    attachQuickSendListeners() {
        // WhatsApp
        if (this.closeWhatsAppModal) {
            this.closeWhatsAppModal.addEventListener('click', () => this.closeQuickModal('whatsapp'));
        }
        if (this.cancelWhatsAppSend) {
            this.cancelWhatsAppSend.addEventListener('click', () => this.closeQuickModal('whatsapp'));
        }
        if (this.confirmWhatsAppSend) {
            this.confirmWhatsAppSend.addEventListener('click', () => this.sendQuickWhatsApp());
        }
        
        // E-mail
        if (this.closeEmailModal) {
            this.closeEmailModal.addEventListener('click', () => this.closeQuickModal('email'));
        }
        if (this.cancelEmailSend) {
            this.cancelEmailSend.addEventListener('click', () => this.closeQuickModal('email'));
        }
        if (this.confirmEmailSend) {
            this.confirmEmailSend.addEventListener('click', () => this.sendQuickEmail());
        }
        
        // Documento
        if (this.closeDocumentModal) {
            this.closeDocumentModal.addEventListener('click', () => this.closeQuickModal('document'));
        }
        if (this.cancelDocumentSend) {
            this.cancelDocumentSend.addEventListener('click', () => this.closeQuickModal('document'));
        }
        if (this.confirmDocumentSend) {
            this.confirmDocumentSend.addEventListener('click', () => this.sendQuickDocument());
        }
        
        // Backdrop dos modais rápidos
        [this.quickWhatsAppModal, this.quickEmailModal, this.quickDocumentModal].forEach(modal => {
            const backdrop = modal?.querySelector('.bulk-send-modal-backdrop');
            if (backdrop) {
                const type = modal.id.includes('WhatsApp') ? 'whatsapp' : 
                            modal.id.includes('Email') ? 'email' : 'document';
                backdrop.addEventListener('click', () => this.closeQuickModal(type));
            }
        });
    }

    // ===== CHECKBOX HANDLING =====
    handleSelectAll(e) {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
            const clientId = parseInt(checkbox.dataset.clientId);
            if (e.target.checked) {
                this.selectedClients.add(clientId);
            } else {
                this.selectedClients.delete(clientId);
            }
        });
        this.updateSelectedCount();
    }

    handleRowCheckboxChange(checkbox) {
        const clientId = parseInt(checkbox.dataset.clientId);
        if (checkbox.checked) {
            this.selectedClients.add(clientId);
        } else {
            this.selectedClients.delete(clientId);
        }
        
        // Atualizar select all
        const allCheckboxes = document.querySelectorAll('.row-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.checked = allCheckboxes.length === checkedCheckboxes.length;
        }
        
        this.updateSelectedCount();
    }

    updateSelectedCount() {
        const count = this.selectedClients.size;
        if (this.selectedCountBadge) {
            this.selectedCountBadge.textContent = count;
        }
        
        // Mostrar/ocultar botão flutuante
        if (this.bulkSendFloatingBtn) {
            if (count > 0) {
                this.bulkSendFloatingBtn.classList.add('show');
            } else {
                this.bulkSendFloatingBtn.classList.remove('show');
            }
        }
    }

    // ===== BULK SEND MODAL =====
    openBulkSendModal() {
        if (this.selectedClients.size === 0) {
            this.showToast('Selecione pelo menos um cliente', 'warning');
            return;
        }
        
        this.currentStep = 1;
        this.sendType = '';
        this.bulkSendModal.classList.add('active');
        this.updateWizardStep();
        lucide.createIcons();
    }

    closeBulkModal() {
        this.bulkSendModal.classList.remove('active');
        this.resetWizard();
    }

    resetWizard() {
        this.currentStep = 1;
        this.sendType = '';
        this.sendTypeCards.forEach(card => card.classList.remove('selected'));
        this.updateWizardStep();
    }

    // ===== WIZARD NAVIGATION =====
    nextStep() {
        if (this.currentStep === 1) {
            if (!this.sendType) {
                this.showToast('Selecione um tipo de envio', 'warning');
                return;
            }
            this.loadContactsForStep2();
        } else if (this.currentStep === 2) {
            const selectedContacts = this.contactsList.querySelectorAll('input[type="checkbox"]:checked');
            if (selectedContacts.length === 0) {
                this.showToast('Selecione pelo menos um contato', 'warning');
                return;
            }
            this.prepareSummaryStep();
        } else if (this.currentStep === 3) {
            this.executeBulkSend();
            return;
        }
        
        this.currentStep++;
        this.updateWizardStep();
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateWizardStep();
        }
    }

    updateWizardStep() {
        // Atualizar indicadores de passo
        document.querySelectorAll('.wizard-step').forEach((step, index) => {
            const stepNumber = index + 1;
            if (stepNumber === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else if (stepNumber < this.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
        
        // Mostrar/ocultar conteúdo dos passos
        this.wizardStep1.style.display = this.currentStep === 1 ? 'block' : 'none';
        this.wizardStep2.style.display = this.currentStep === 2 ? 'block' : 'none';
        this.wizardStep3.style.display = this.currentStep === 3 ? 'block' : 'none';
        
        // Atualizar botões
        this.wizardBackBtn.style.display = this.currentStep > 1 ? 'flex' : 'none';
        this.wizardNextBtn.querySelector('span').textContent = this.currentStep === 3 ? 'Enviar' : 'Próximo';
        
        lucide.createIcons();
    }

    // ===== STEP 1: TIPO DE ENVIO =====
    selectSendType(card) {
        this.sendTypeCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.sendType = card.dataset.type;
    }

    // ===== STEP 2: SELECIONAR CONTATOS =====
    loadContactsForStep2() {
        this.contactsList.innerHTML = '';
        
        // Pegar clientes da página atual
        const clientRows = document.querySelectorAll('.row-checkbox:checked');
        clientRows.forEach(checkbox => {
            const clientId = checkbox.dataset.clientId;
            const row = checkbox.closest('tr');
            const clientName = row.querySelector('td:nth-child(2)')?.textContent || 'Cliente';
            const clientPhone = row.querySelector('td:nth-child(4)')?.textContent || '';
            const clientCity = row.querySelector('td:nth-child(6)')?.textContent || '';
            
            const contactItem = document.createElement('div');
            contactItem.className = 'contact-item';
            contactItem.innerHTML = `
                <input type="checkbox" checked data-client-id="${clientId}">
                <div class="contact-info">
                    <div class="contact-name">${clientName}</div>
                    <div class="contact-details">${clientPhone} • ${clientCity}</div>
                </div>
            `;
            
            this.contactsList.appendChild(contactItem);
        });
        
        lucide.createIcons();
    }

    handleSelectAllWizard(e) {
        const checkboxes = this.contactsList.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    }

    // ===== STEP 3: CONFIRMAÇÃO =====
    prepareSummaryStep() {
        const typeLabels = {
            whatsapp: 'WhatsApp',
            email: 'E-mail',
            document: 'Documento'
        };
        
        this.summaryType.textContent = typeLabels[this.sendType] || '-';
        
        const selectedContacts = this.contactsList.querySelectorAll('input[type="checkbox"]:checked');
        this.summaryRecipients.textContent = `${selectedContacts.length} selecionados`;
        
        // Mostrar área apropriada
        this.messageInputArea.style.display = (this.sendType === 'whatsapp' || this.sendType === 'email') ? 'block' : 'none';
        this.fileUploadArea.style.display = this.sendType === 'document' ? 'block' : 'none';
    }

    executeBulkSend() {
        const selectedContacts = Array.from(this.contactsList.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.dataset.clientId);
        
        const data = {
            type: this.sendType,
            recipients: selectedContacts,
            message: this.bulkMessageText?.value || '',
            file: this.bulkFileInput?.files[0] || null
        };
        
        console.log('Enviando em massa:', data);
        
        this.showToast(`Envio iniciado para ${selectedContacts.length} contatos via ${this.sendType}`, 'success');
        this.closeBulkModal();
    }

    // ===== QUICK SEND MODALS =====
    openQuickWhatsApp(client) {
        this.currentClient = client;
        document.getElementById('whatsappClientName').textContent = client.nome || client.name;
        document.getElementById('quickWhatsAppMessage').value = '';
        this.quickWhatsAppModal.classList.add('active');
        lucide.createIcons();
    }

    openQuickEmail(client) {
        this.currentClient = client;
        document.getElementById('emailClientName').textContent = client.nome || client.name;
        document.getElementById('quickEmailSubject').value = '';
        document.getElementById('quickEmailMessage').value = '';
        this.quickEmailModal.classList.add('active');
        lucide.createIcons();
    }

    openQuickDocument(client) {
        this.currentClient = client;
        document.getElementById('documentClientName').textContent = client.nome || client.name;
        document.getElementById('quickDocumentMessage').value = '';
        document.getElementById('quickDocumentFile').value = '';
        this.quickDocumentModal.classList.add('active');
        lucide.createIcons();
    }

    closeQuickModal(type) {
        const modals = {
            whatsapp: this.quickWhatsAppModal,
            email: this.quickEmailModal,
            document: this.quickDocumentModal
        };
        modals[type]?.classList.remove('active');
        this.currentClient = null;
    }

    sendQuickWhatsApp() {
        const message = document.getElementById('quickWhatsAppMessage').value;
        if (!message.trim()) {
            this.showToast('Digite uma mensagem', 'warning');
            return;
        }
        
        console.log('Enviando WhatsApp para:', this.currentClient, 'Mensagem:', message);
        this.showToast(`WhatsApp enviado para ${this.currentClient.nome || this.currentClient.name}`, 'success');
        this.closeQuickModal('whatsapp');
    }

    sendQuickEmail() {
        const subject = document.getElementById('quickEmailSubject').value;
        const message = document.getElementById('quickEmailMessage').value;
        
        if (!subject.trim() || !message.trim()) {
            this.showToast('Preencha assunto e mensagem', 'warning');
            return;
        }
        
        console.log('Enviando E-mail para:', this.currentClient, 'Assunto:', subject, 'Mensagem:', message);
        this.showToast(`E-mail enviado para ${this.currentClient.nome || this.currentClient.name}`, 'success');
        this.closeQuickModal('email');
    }

    sendQuickDocument() {
        const file = document.getElementById('quickDocumentFile').files[0];
        const message = document.getElementById('quickDocumentMessage').value;
        
        if (!file) {
            this.showToast('Selecione um arquivo', 'warning');
            return;
        }
        
        console.log('Enviando Documento para:', this.currentClient, 'Arquivo:', file.name, 'Mensagem:', message);
        this.showToast(`Documento enviado para ${this.currentClient.nome || this.currentClient.name}`, 'success');
        this.closeQuickModal('document');
    }

    // ===== UTILITIES =====
    showToast(message, type = 'info') {
        // Usar o sistema de toast existente do ClientManager
        if (window.clientManager && window.clientManager.showToast) {
            window.clientManager.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.bulkSendManager = new BulkSendManager();
    console.log('✅ Bulk Send Manager inicializado');
});
