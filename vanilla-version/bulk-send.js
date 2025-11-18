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
    // Wizard Step 3 - Templates/Email
    this.bulkTemplateRow = document.getElementById('bulkTemplateRow');
    this.bulkTemplateSelect = document.getElementById('bulkTemplateSelect');
    this.applyBulkTemplateBtn = document.getElementById('applyBulkTemplateBtn');
    this.bulkEmailSubjectRow = document.getElementById('bulkEmailSubjectRow');
    this.bulkEmailSubject = document.getElementById('bulkEmailSubject');
    this.bulkEmailAttachmentRow = document.getElementById('bulkEmailAttachmentRow');
    this.bulkEmailAttachments = document.getElementById('bulkEmailAttachments');
        
        // Modais de envio rápido
        this.quickWhatsAppModal = document.getElementById('quickWhatsAppModal');
        this.quickEmailModal = document.getElementById('quickEmailModal');
        this.quickDocumentModal = document.getElementById('quickDocumentModal');

    // Campos dos modais rápidos - WhatsApp
    this.quickWhatsAppTemplateSelect = document.getElementById('quickWhatsAppTemplate');
    this.applyWhatsAppTemplateBtn = document.getElementById('applyWhatsAppTemplate');
    this.quickWhatsAppMessage = document.getElementById('quickWhatsAppMessage');

    // Campos dos modais rápidos - Email
    this.quickEmailTemplateSelect = document.getElementById('quickEmailTemplate');
    this.applyEmailTemplateBtn = document.getElementById('applyEmailTemplate');
    this.quickEmailSubject = document.getElementById('quickEmailSubject');
    this.quickEmailMessage = document.getElementById('quickEmailMessage');
    this.quickEmailAttachment = document.getElementById('quickEmailAttachment');
        
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

        // Wizard - aplicar template
        if (this.applyBulkTemplateBtn) {
            this.applyBulkTemplateBtn.addEventListener('click', () => this.applyTemplate('wizard'));
        }
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
        if (this.applyWhatsAppTemplateBtn) {
            this.applyWhatsAppTemplateBtn.addEventListener('click', () => this.applyTemplate('whatsapp'));
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
        if (this.applyEmailTemplateBtn) {
            this.applyEmailTemplateBtn.addEventListener('click', () => this.applyTemplate('email'));
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

        // Wizard templates e campos extras
        const isMsg = (this.sendType === 'whatsapp' || this.sendType === 'email');
        if (this.bulkTemplateRow) this.bulkTemplateRow.style.display = isMsg ? 'flex' : 'none';
        if (this.bulkEmailSubjectRow) this.bulkEmailSubjectRow.style.display = (this.sendType === 'email') ? 'block' : 'none';
        if (this.bulkEmailAttachmentRow) this.bulkEmailAttachmentRow.style.display = (this.sendType === 'email') ? 'block' : 'none';
        if (isMsg) this.populateTemplateSelect(this.sendType, true);
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
        
        console.log('Envio em massa (simulado):', data);
        const label = this.sendType === 'email' ? 'E-mail' : this.sendType === 'whatsapp' ? 'WhatsApp' : 'Documento';
        this.showToast(`Envio em massa (simulado) para ${selectedContacts.length} contatos via ${label}`, 'success');
        this.closeBulkModal();
    }

    // ===== QUICK SEND MODALS =====
    openQuickWhatsApp(client) {
        this.currentClient = client;
        document.getElementById('whatsappClientName').textContent = client.nome || client.name;
        this.quickWhatsAppMessage.value = '';
        this.populateTemplateSelect('whatsapp');
        this.quickWhatsAppModal.classList.add('active');
        lucide.createIcons();
    }

    openQuickEmail(client) {
        this.currentClient = client;
        document.getElementById('emailClientName').textContent = client.nome || client.name;
        this.quickEmailSubject.value = '';
        this.quickEmailMessage.value = '';
        if (this.quickEmailAttachment) this.quickEmailAttachment.value = '';
        this.populateTemplateSelect('email');
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
        const message = this.quickWhatsAppMessage.value;
        if (!message.trim()) {
            this.showToast('Digite uma mensagem', 'warning');
            return;
        }
        
        console.log('Enviando WhatsApp para:', this.currentClient, 'Mensagem:', message);
        this.showToast(`WhatsApp enviado para ${this.currentClient.nome || this.currentClient.name}`, 'success');
        this.closeQuickModal('whatsapp');
    }

    sendQuickEmail() {
        const subject = this.quickEmailSubject.value;
        const message = this.quickEmailMessage.value;
        
        if (!subject.trim() || !message.trim()) {
            this.showToast('Preencha assunto e mensagem', 'warning');
            return;
        }
        if (!this.currentClient?.email) {
            this.showToast('Este cliente não possui e-mail cadastrado', 'warning');
            return;
        }

        const files = Array.from(this.quickEmailAttachment?.files || []);
        const to = this.currentClient.email;
        window.sendEmail({ to, subject, html: message, attachments: files })
            .then(() => {
                this.showToast(`E-mail enviado para ${this.currentClient.nome || this.currentClient.name}`, 'success');
                this.closeQuickModal('email');
            })
            .catch((err) => {
                console.error('Erro ao enviar e-mail:', err);
                this.showToast(`Erro ao enviar e-mail: ${err.message}`, 'error');
            });
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

    // ===== TEMPLATES =====
    populateTemplateSelect(channel, isWizard = false) {
        const templates = (window.messageTemplates && window.messageTemplates[channel]) || [];
        const select = isWizard ? this.bulkTemplateSelect : (channel === 'whatsapp' ? this.quickWhatsAppTemplateSelect : this.quickEmailTemplateSelect);
        if (!select) return;
        select.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Selecione um modelo...';
        select.appendChild(placeholder);
        templates.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            select.appendChild(opt);
        });
        select.selectedIndex = 0;
    }

    applyTemplate(channel) {
        let select;
        if (channel === 'wizard') {
            select = this.bulkTemplateSelect;
        } else {
            select = channel === 'whatsapp' ? this.quickWhatsAppTemplateSelect : this.quickEmailTemplateSelect;
        }
    if (!select) return;
        const templateId = select.value;
        if (!templateId) {
            this.showToast('Selecione um modelo primeiro', 'warning');
            return;
        }
        const effectiveChannel = channel === 'wizard' ? this.sendType : channel;
        const list = (window.messageTemplates && window.messageTemplates[effectiveChannel]) || [];
        const tpl = list.find(t => t.id === templateId);
        if (!tpl) return;
        // Para wizard (múltiplos), não personaliza por nome.
        const replaceVars = (str) => (str || '').replace(/\{\{\s*nome\s*\}\}/gi, '');
        if (channel === 'wizard') {
            if (this.sendType === 'whatsapp') {
                this.bulkMessageText.value = replaceVars(tpl.text || '');
            } else if (this.sendType === 'email') {
                this.bulkEmailSubject.value = replaceVars(tpl.subject || '');
                this.bulkMessageText.value = replaceVars(tpl.html || tpl.text || '');
            }
        } else if (channel === 'whatsapp') {
            const name = this.currentClient?.nome || this.currentClient?.name || '';
            const replaceOne = (s) => (s || '').replace(/\{\{\s*nome\s*\}\}/gi, name);
            this.quickWhatsAppMessage.value = replaceOne(tpl.text || '');
        } else if (channel === 'email') {
            const name = this.currentClient?.nome || this.currentClient?.name || '';
            const replaceOne = (s) => (s || '').replace(/\{\{\s*nome\s*\}\}/gi, name);
            this.quickEmailSubject.value = replaceOne(tpl.subject || '');
            this.quickEmailMessage.value = replaceOne(tpl.html || tpl.text || '');
        }
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.bulkSendManager = new BulkSendManager();
    console.log('✅ Bulk Send Manager inicializado');
});
