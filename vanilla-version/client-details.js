// ============================================================================
// SISTEMA DE DETALHES DO CLIENTE
// ============================================================================

/**
 * Definições de tipos de cliente
 */
const clientTypes = {
    school: 'Escola',
    network: 'Rede de Ensino'
};

class ClientDetailsManager {
    constructor() {
        this.clientId = null;
        this.client = null;
        this.apiAvailable = false;
        this.currentUser = null;
        
        // Verificar autenticação antes de continuar
        if (!this.checkAuthentication()) {
            return;
        }
        
        // Elementos DOM
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.clientDetailsSections = document.getElementById('clientDetailsSections');
        this.clientSubtitle = document.getElementById('clientSubtitle');
        this.toastContainer = document.getElementById('toastContainer');
        
        this.init();
    }

    /**
     * Inicializa o sistema
     */
    async init() {
        // Obtém o ID do cliente da URL
        this.clientId = this.getClientIdFromURL();
        
        if (!this.clientId) {
            this.showErrorState();
            return;
        }

        // Carrega os dados do cliente
        await this.loadClientData();
        
        // Inicializa os ícones do Lucide
        this.initializeLucideIcons();
    }

    /**
     * Obtém o ID do cliente da URL
     */
    getClientIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    /**
     * Carrega os dados do cliente
     */
    async loadClientData() {
        try {
            // Verificar se a API está disponível
            this.apiAvailable = await checkApiHealth();
            
            if (this.apiAvailable) {
                console.log('✅ API disponível, carregando detalhes do servidor');
                const response = await fetchClientDetails(this.clientId);
                // Accept both { success: true, data: ... } and direct object
                let clientData = null;
                if (response && typeof response === 'object') {
                    if (response.success && response.data) {
                        clientData = response.data;
                    } else if (response.id || response.nome) {
                        clientData = response;
                    }
                }
                if (clientData) {
                    this.client = formatClientData({ data: clientData });
                } else {
                    throw new Error(response.error || 'Erro ao carregar cliente');
                }
            } else {
                console.error('❌ API indisponível. Usando dados mock como fallback.');
                this.showToast('API indisponível. Mostrando dados de demonstração.', 'warning');
                this.client = this.getMockClientData();
            }
            
            if (!this.client) {
                this.showErrorState();
                return;
            }

            // Atualiza o título da página
            this.updatePageTitle();
            
            // Renderiza os detalhes
            this.renderClientDetails();
            
            // Mostra o conteúdo
            this.showContent();
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados do cliente:', error);
            this.showToast('Erro ao carregar dados do cliente', 'error');
            
            // Sem fallback - apenas dados reais do banco
            this.client = null;
            
            if (this.client) {
                console.log('🔄 Usando dados mock como fallback');
                this.updatePageTitle();
                this.renderClientDetails();
                this.showContent();
            } else {
                this.showErrorState();
            }
        }
    }

    /**
     * Atualiza o título da página
     */
    updatePageTitle() {
        const typeText = clientTypes[this.client.type] || this.client.type;
        document.title = `${this.client.name} - Detalhes do Cliente`;
        this.clientSubtitle.textContent = `${this.client.name} • ${typeText} • ${this.client.city}/${this.client.state}`;
    }

    /**
     * Renderiza os detalhes completos do cliente
     */
    renderClientDetails() {
        const typeText = clientTypes[this.client.type] || this.client.type;
        const createdDate = this.formatDate(this.client.createdAt);
        const updatedDate = this.formatDate(this.client.updatedAt);

        this.clientDetailsSections.innerHTML = `
            <!-- Informações Básicas -->
            <div class="detail-section">
                <div class="section-header">
                    <i data-lucide="building-2"></i>
                    <h3>Informações Básicas</h3>
                </div>
                <div class="client-detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Nome</div>
                        <div class="detail-value">${this.escapeHtml(this.client.name)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Tipo</div>
                        <div class="detail-value">${typeText}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Endereço</div>
                        <div class="detail-value">${this.escapeHtml(this.client.address)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Telefone</div>
                        <div class="detail-value">${this.escapeHtml(this.client.phone)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">CNPJ</div>
                        <div class="detail-value">${this.escapeHtml(this.client.cnpj)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Cidade/UF</div>
                        <div class="detail-value">${this.escapeHtml(this.client.city)} - ${this.escapeHtml(this.client.state)}</div>
                    </div>
                    ${this.client.observations ? `
                    <div class="detail-item full-width">
                        <div class="detail-label">Observações</div>
                        <div class="detail-value">${this.escapeHtml(this.client.observations)}</div>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Equipe Pedagógica -->
            ${this.client.educationalTeam && this.client.educationalTeam.length > 0 ? `
            <div class="detail-section">
                <div class="section-header">
                    <i data-lucide="users"></i>
                    <h3>Dados Equipe Pedagógica</h3>
                    <div class="section-actions">
                        <button class="action-btn btn-primary" 
                                title="Enviar aos Selecionados" 
                                onclick="clientDetailsManager.openSendModal('educational')">
                            <i data-lucide="send"></i>
                            <span>Enviar</span>
                        </button>
                    </div>
                </div>
                <div class="team-table-container">
                    <table class="team-table">
                        <thead>
                            <tr>
                                <th style="width: 40px;">
                                    <input type="checkbox" 
                                           id="selectAllEducational" 
                                           onchange="clientDetailsManager.toggleSelectAll('educational', this.checked)"
                                           title="Selecionar Todos">
                                </th>
                                <th>Função</th>
                                <th>Nome</th>
                                <th>WhatsApp</th>
                                <th>Email</th>
                                <th>Rede Social</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.client.educationalTeam.map((member, index) => `
                            <tr>
                                <td>
                                    <input type="checkbox" 
                                           class="contact-checkbox educational-checkbox" 
                                           data-section="educational"
                                           data-index="${index}"
                                           data-name="${this.escapeHtml(member.name)}"
                                           data-email="${this.escapeHtml(member.email)}"
                                           data-whatsapp="${member.whatsapp.replace(/[^\d]/g, '')}"
                                           onchange="clientDetailsManager.updateSelectAllState('educational')">
                                </td>
                                <td class="team-role">${this.escapeHtml(member.role)}</td>
                                <td class="team-name">${this.escapeHtml(member.name)}</td>
                                <td class="team-whatsapp">
                                    <a href="https://wa.me/${member.whatsapp.replace(/[^\d]/g, '')}" target="_blank" class="contact-link">
                                        ${this.escapeHtml(member.whatsapp)}
                                    </a>
                                </td>
                                <td class="team-email">
                                    <a href="mailto:${member.email}" class="contact-link">
                                        ${this.escapeHtml(member.email)}
                                    </a>
                                </td>
                                <td class="team-social">${this.escapeHtml(member.socialMedia)}</td>
                                <td>
                                    <div class="actions-group">
                                        <button class="action-btn btn-document" 
                                                title="Enviar Documento" 
                                                onclick="clientDetailsManager.sendToContact('document', '${this.escapeHtml(member.name)}', '${this.escapeHtml(member.email)}', '${member.whatsapp.replace(/[^\d]/g, '')}')">
                                            <i data-lucide="file-text"></i>
                                        </button>
                                        <button class="action-btn btn-whatsapp" 
                                                title="Enviar WhatsApp" 
                                                onclick="clientDetailsManager.sendToContact('whatsapp', '${this.escapeHtml(member.name)}', '${this.escapeHtml(member.email)}', '${member.whatsapp.replace(/[^\d]/g, '')}')">
                                            <i data-lucide="message-circle"></i>
                                        </button>
                                        <button class="action-btn btn-share" 
                                                title="Compartilhar" 
                                                onclick="clientDetailsManager.sendToContact('share', '${this.escapeHtml(member.name)}', '${this.escapeHtml(member.email)}', '${member.whatsapp.replace(/[^\d]/g, '')}')">
                                            <i data-lucide="share-2"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}

            <!-- Corpo Docente -->
            ${this.client.teachers && this.client.teachers.length > 0 ? `
            <div class="detail-section">
                <div class="section-header">
                    <i data-lucide="graduation-cap"></i>
                    <h3>Corpo Docente</h3>
                    <div class="section-actions">
                        <button class="action-btn btn-primary" 
                                title="Enviar aos Selecionados" 
                                onclick="clientDetailsManager.openSendModal('teachers')">
                            <i data-lucide="send"></i>
                            <span>Enviar</span>
                        </button>
                    </div>
                </div>
                <div class="team-table-container">
                    <table class="team-table">
                        <thead>
                            <tr>
                                <th style="width: 40px;">
                                    <input type="checkbox" 
                                           id="selectAllTeachers" 
                                           onchange="clientDetailsManager.toggleSelectAll('teachers', this.checked)"
                                           title="Selecionar Todos">
                                </th>
                                <th>Função</th>
                                <th>Nome</th>
                                <th>WhatsApp</th>
                                <th>Email</th>
                                <th>Escola</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.client.teachers.map((teacher, index) => `
                            <tr>
                                <td>
                                    <input type="checkbox" 
                                           class="contact-checkbox teachers-checkbox" 
                                           data-section="teachers"
                                           data-index="${index}"
                                           data-name="${this.escapeHtml(teacher.name)}"
                                           data-email="${this.escapeHtml(teacher.email)}"
                                           data-whatsapp="${teacher.whatsapp.replace(/[^\d]/g, '')}"
                                           onchange="clientDetailsManager.updateSelectAllState('teachers')">
                                </td>
                                <td class="team-role">${this.escapeHtml(teacher.role)}</td>
                                <td class="team-name">${this.escapeHtml(teacher.name)}</td>
                                <td class="team-whatsapp">
                                    <a href="https://wa.me/${teacher.whatsapp.replace(/[^\d]/g, '')}" target="_blank" class="contact-link">
                                        ${this.escapeHtml(teacher.whatsapp)}
                                    </a>
                                </td>
                                <td class="team-email">
                                    <a href="mailto:${teacher.email}" class="contact-link">
                                        ${this.escapeHtml(teacher.email)}
                                    </a>
                                </td>
                                <td class="team-school">${this.escapeHtml(teacher.school)}</td>
                                <td>
                                    <div class="actions-group">
                                        <button class="action-btn btn-document" 
                                                title="Enviar Documento" 
                                                onclick="clientDetailsManager.sendToContact('document', '${this.escapeHtml(teacher.name)}', '${this.escapeHtml(teacher.email)}', '${teacher.whatsapp.replace(/[^\d]/g, '')}')">
                                            <i data-lucide="file-text"></i>
                                        </button>
                                        <button class="action-btn btn-whatsapp" 
                                                title="Enviar WhatsApp" 
                                                onclick="clientDetailsManager.sendToContact('whatsapp', '${this.escapeHtml(teacher.name)}', '${this.escapeHtml(teacher.email)}', '${teacher.whatsapp.replace(/[^\d]/g, '')}')">
                                            <i data-lucide="message-circle"></i>
                                        </button>
                                        <button class="action-btn btn-share" 
                                                title="Compartilhar" 
                                                onclick="clientDetailsManager.sendToContact('share', '${this.escapeHtml(teacher.name)}', '${this.escapeHtml(teacher.email)}', '${teacher.whatsapp.replace(/[^\d]/g, '')}')">
                                            <i data-lucide="share-2"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}

            <!-- Gerador de Propostas -->
            <div class="detail-section">
                <div class="section-header">
                    <i data-lucide="file-plus"></i>
                    <h3>Gerador de Propostas</h3>
                </div>
                <div class="proposal-generator-content">
                    <p class="proposal-description">Selecione o tipo de proposta que deseja gerar para este cliente:</p>
                    <div class="proposal-form">
                        <div class="form-group">
                            <label for="proposalType" class="form-label">
                                <i data-lucide="file-text"></i>
                                Tipo de Proposta
                            </label>
                            <select id="proposalType" class="proposal-select">
                                <option value="">Selecione uma proposta...</option>
                                <option value="afro">Proposta Afro</option>
                                <option value="paz">Proposta Paz</option>
                                <option value="gamer">Proposta Gamer</option>
                            </select>
                        </div>
                        <button id="generateProposalBtn" class="generate-proposal-btn" onclick="clientDetailsManager.generateProposal()">
                            <i data-lucide="zap"></i>
                            <span>Gerar Proposta</span>
                        </button>
                    </div>
                    <div id="proposalResult" class="proposal-result" style="display: none;">
                        <div class="result-header">
                            <i data-lucide="check-circle"></i>
                            <span>Proposta gerada com sucesso!</span>
                        </div>
                        <div class="result-actions">
                            <button class="action-btn btn-download" title="Baixar Proposta">
                                <i data-lucide="download"></i>
                                Baixar PDF
                            </button>
                            <button class="action-btn btn-email" title="Enviar por Email">
                                <i data-lucide="mail"></i>
                                Enviar Email
                            </button>
                            <button class="action-btn btn-whatsapp" title="Compartilhar WhatsApp">
                                <i data-lucide="message-circle"></i>
                                WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Rede em Números -->
            ${this.client.studentSegmentation && this.client.studentSegmentation.length > 0 ? `
            <div class="detail-section">
                <div class="section-header">
                    <i data-lucide="bar-chart-3"></i>
                    <h3>Rede em Números</h3>
                    ${this.client.totalStudents ? `<span class="total-students">(Total: ${this.client.totalStudents.toLocaleString('pt-BR')} alunos)</span>` : ''}
                    <div class="section-actions">
                        <button class="action-btn btn-document" 
                                title="Enviar Documento" 
                                onclick="clientDetailsManager.handleSectionAction('document', 'students', 'Dados da Rede')">
                            <i data-lucide="file-text"></i>
                        </button>
                        <button class="action-btn btn-whatsapp" 
                                title="Enviar WhatsApp" 
                                onclick="clientDetailsManager.handleSectionAction('whatsapp', 'students', 'Dados da Rede')">
                            <i data-lucide="message-circle"></i>
                        </button>
                        <button class="action-btn btn-share" 
                                title="Compartilhar" 
                                onclick="clientDetailsManager.handleSectionAction('share', 'students', 'Dados da Rede')">
                            <i data-lucide="share-2"></i>
                        </button>
                    </div>
                </div>
                <div class="students-grid">
                    ${this.client.studentSegmentation.map(segment => `
                    <div class="student-segment">
                        <div class="segment-header">
                            <span class="segment-name">${this.escapeHtml(segment.segment)}</span>
                            <span class="segment-zone zone-${segment.zone.toLowerCase()}">${this.escapeHtml(segment.zone)}</span>
                        </div>
                        <div class="segment-details">
                            <div class="segment-year">${this.escapeHtml(segment.year)}</div>
                            <div class="segment-quantity">
                                <span class="quantity-number">${segment.quantity.toLocaleString('pt-BR')}</span>
                                <span class="quantity-label">alunos</span>
                            </div>
                        </div>
                        <div class="segment-actions">
                            <button class="action-btn btn-document" 
                                    title="Enviar Documento" 
                                    onclick="clientDetailsManager.handleSectionAction('document', 'segment', '${segment.segment}')">
                                <i data-lucide="file-text"></i>
                            </button>
                            <button class="action-btn btn-whatsapp" 
                                    title="Enviar WhatsApp" 
                                    onclick="clientDetailsManager.handleSectionAction('whatsapp', 'segment', '${segment.segment}')">
                                <i data-lucide="message-circle"></i>
                            </button>
                            <button class="action-btn btn-share" 
                                    title="Compartilhar" 
                                    onclick="clientDetailsManager.handleSectionAction('share', 'segment', '${segment.segment}')">
                                <i data-lucide="share-2"></i>
                            </button>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Informações do Sistema -->
            <div class="detail-section">
                <div class="section-header">
                    <i data-lucide="settings"></i>
                    <h3>Informações do Sistema</h3>
                </div>
                <div class="client-detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Sistema de Faturamento</div>
                        <div class="detail-value">${this.escapeHtml(this.client.invoiceSystem || 'Não informado')}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Data de Criação</div>
                        <div class="detail-value">${createdDate}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Última Atualização</div>
                        <div class="detail-value">${updatedDate}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Status</div>
                        <div class="detail-value">
                            <span class="status-badge status-${this.client.status}">
                                ${this.client.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Manipula ações específicas das seções
     */
    handleSectionAction(action, section, target) {
        const actionMessages = {
            document: 'Documento enviado para',
            whatsapp: 'Mensagem WhatsApp enviada para',
            share: 'Compartilhado com redes sociais para'
        };

        const sectionNames = {
            educational: 'Equipe Pedagógica',
            teachers: 'Corpo Docente',
            students: 'Dados da Rede',
            segment: 'Segmento'
        };

        const message = `${actionMessages[action]} ${target} (${sectionNames[section]})`;
        
        // Aqui você pode implementar a lógica específica para cada ação
        switch (action) {
            case 'document':
                this.showToast('info', message);
                break;
            case 'whatsapp':
                this.showToast('success', message);
                break;
            case 'share':
                this.showToast('warning', message);
                break;
        }
    }

    /**
     * Mostra estado de erro
     */
    showErrorState() {
        this.loadingState.style.display = 'none';
        this.errorState.style.display = 'block';
        this.clientDetailsSections.style.display = 'none';
    }

    /**
     * Mostra o conteúdo
     */
    showContent() {
        this.loadingState.style.display = 'none';
        this.errorState.style.display = 'none';
        this.clientDetailsSections.style.display = 'block';
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
     * Exibe uma notificação toast
     */
    showToast(type, message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconMap = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        
        toast.innerHTML = `
            <i data-lucide="${iconMap[type]}"></i>
            <span>${message}</span>
        `;
        
        this.toastContainer.appendChild(toast);
        
        // Força reflow para animação
        toast.offsetHeight;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
        
        // Reinicializa ícones do Lucide
        this.initializeLucideIcons();
    }

    /**
     * Utilitários
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
    }

    formatDate(date) {
        if (!date) return 'N/A';
        
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    /**
     * Gera uma proposta com base no tipo selecionado
     */
    generateProposal() {
        const selectElement = document.getElementById('proposalType');
        const resultDiv = document.getElementById('proposalResult');
        const selectedValue = selectElement.value;
        
        if (!selectedValue) {
            this.showToast('warning', 'Por favor, selecione um tipo de proposta');
            return;
        }
        
        const proposalNames = {
            'afro': 'Proposta Afro',
            'paz': 'Proposta Paz',
            'gamer': 'Proposta Gamer'
        };
        
        const proposalName = proposalNames[selectedValue];
        
        // Simular geração de proposta
        this.showToast('success', `${proposalName} gerada com sucesso!`);
        
        // Mostrar resultado
        resultDiv.style.display = 'block';
        
        // Reinicializar ícones Lucide
        setTimeout(() => {
            this.initializeLucideIcons();
        }, 100);
        
        // Log para debug
        console.log(`📄 Proposta gerada: ${proposalName} para cliente ${this.client.name}`);
    }

    /**
     * Dados mock para demonstração quando a API não está disponível
     */
    getMockClientData() {
        return {
            id: 'client-3',
            name: 'Colégio Santa Maria',
            type: 'school',
            address: 'Rua das Palmeiras, 789, Jardins',
            phone: '(11) 3456-7892',
            cnpj: '11.222.333/0001-44',
            city: 'São Paulo',
            state: 'SP',
            microRegion: 'Sul',
            invoiceSystem: 'Totvs',
            observations: 'Colégio particular de alto padrão.',
            status: 'active',
            createdAt: new Date('2023-03-10'),
            updatedAt: new Date('2024-09-15'),
            
            // Equipe Pedagógica
            educationalTeam: [
                {
                    id: 'et-3',
                    role: 'Coordenador Acadêmico',
                    name: 'Prof. Fernando Alves',
                    whatsapp: '(11) 94567-8911',
                    email: 'coordenacao@santamaria.edu.br',
                    socialMedia: '@fernandoalves'
                },
                {
                    id: 'et-4',
                    role: 'Diretor(a) Geral',
                    name: 'Irmã Maria Conceição',
                    whatsapp: '(11) 94567-8910',
                    email: 'diretoria@santamaria.edu.br',
                    socialMedia: '@mariaconceicao'
                }
            ],
            
            // Corpo Docente
            teachers: [
                {
                    id: 't-3',
                    role: 'Professor(a) de Filosofia',
                    name: 'Dr. Ricardo Moreira',
                    whatsapp: '(11) 93456-7890',
                    email: 'ricardo.moreira@santamaria.edu.br',
                    school: 'Colégio Santa Maria'
                },
                {
                    id: 't-4',
                    role: 'Professor(a) de Biologia',
                    name: 'Dra. Angela Ferreira',
                    whatsapp: '(11) 93456-7891',
                    email: 'angela.ferreira@santamaria.edu.br',
                    school: 'Colégio Santa Maria'
                }
            ],
            
            // Rede em Números
            studentSegmentation: [
                {
                    id: 'ss-3',
                    segment: 'URBANA',
                    year: 'Ensino Fundamental I',
                    quantity: 85,
                    zone: 'URBANA'
                },
                {
                    id: 'ss-4',
                    segment: 'URBANA',
                    year: 'Ensino Fundamental II',
                    quantity: 240,
                    zone: 'URBANA'
                },
                {
                    id: 'ss-5',
                    segment: 'URBANA',
                    year: 'Ensino Médio',
                    quantity: 200,
                    zone: 'URBANA'
                },
                {
                    id: 'ss-6',
                    segment: 'URBANA',
                    year: 'Educação Infantil',
                    quantity: 180,
                    zone: 'URBANA'
                }
            ],
            
            // Totais
            totals: {
                educationalTeam: 2,
                teachers: 2,
                students: 705,
                segments: 4
            },
            
            // Total de estudantes calculado
            totalStudents: 705
        };
    }

    /**
     * Verifica se o usuário está autenticado
     */
    checkAuthentication() {
        const userData = localStorage.getItem('currentUser');
        
        if (!userData) {
            // Redirecionar para login se não estiver autenticado
            window.location.href = 'login.html';
            return false;
        }
        
        try {
            this.currentUser = JSON.parse(userData);
            return true;
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
            return false;
        }
    }

    /**
     * Seleciona/deseleciona todos os checkboxes de uma seção
     */
    toggleSelectAll(section, checked) {
        const checkboxes = document.querySelectorAll(`.${section}-checkbox`);
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
    }

    /**
     * Atualiza o estado do checkbox "Selecionar Todos"
     */
    updateSelectAllState(section) {
        const checkboxes = document.querySelectorAll(`.${section}-checkbox`);
        const selectAllId = section === 'educational' ? 'selectAllEducational' : 'selectAllTeachers';
        const selectAllCheckbox = document.getElementById(selectAllId);
        
        const totalCheckboxes = checkboxes.length;
        const checkedCheckboxes = Array.from(checkboxes).filter(cb => cb.checked).length;
        
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = (totalCheckboxes === checkedCheckboxes && totalCheckboxes > 0);
            selectAllCheckbox.indeterminate = (checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes);
        }
    }

    /**
     * Abre o modal de envio com opções
     */
    openSendModal(section) {
        const checkboxes = document.querySelectorAll(`.${section}-checkbox:checked`);
        
        if (checkboxes.length === 0) {
            this.showToast('warning', 'Selecione pelo menos um contato para enviar');
            return;
        }

        // Coleta os dados dos contatos selecionados
        const selectedContacts = Array.from(checkboxes).map(cb => ({
            name: cb.dataset.name,
            email: cb.dataset.email,
            whatsapp: cb.dataset.whatsapp
        }));

        // Cria o HTML do modal
        const modalHTML = `
            <div id="sendModal" class="modal-overlay" style="display: flex;">
                <div class="send-modal-content">
                    <div class="send-modal-header">
                        <h2>
                            <i data-lucide="send"></i>
                            Enviar para ${selectedContacts.length} contato(s)
                        </h2>
                        <button class="close-button" onclick="clientDetailsManager.closeSendModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="send-modal-body">
                        <div class="selected-contacts-preview">
                            <h4>Contatos Selecionados:</h4>
                            <ul>
                                ${selectedContacts.map(contact => `
                                    <li>
                                        <i data-lucide="user"></i>
                                        ${contact.name}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        <div class="send-options">
                            <h4>Escolha o método de envio:</h4>
                            <div class="send-methods">
                                <button class="send-method-btn btn-whatsapp" onclick='clientDetailsManager.sendToSelected("whatsapp", ${JSON.stringify(selectedContacts)})'>
                                    <i data-lucide="message-circle"></i>
                                    <span>WhatsApp</span>
                                    <small>${selectedContacts.length} mensagens</small>
                                </button>
                                <button class="send-method-btn btn-email" onclick='clientDetailsManager.sendToSelected("email", ${JSON.stringify(selectedContacts)})'>
                                    <i data-lucide="mail"></i>
                                    <span>Email</span>
                                    <small>${selectedContacts.length} emails</small>
                                </button>
                                <button class="send-method-btn btn-document" onclick='clientDetailsManager.sendToSelected("document", ${JSON.stringify(selectedContacts)})'>
                                    <i data-lucide="file-text"></i>
                                    <span>Documento</span>
                                    <small>${selectedContacts.length} documentos</small>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="send-modal-footer">
                        <button class="btn-cancel" onclick="clientDetailsManager.closeSendModal()">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Adiciona o modal ao body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        // Inicializa os ícones do Lucide
        setTimeout(() => this.initializeLucideIcons(), 50);
    }

    /**
     * Fecha o modal de envio
     */
    closeSendModal() {
        const modal = document.getElementById('sendModal');
        if (modal && modal.parentElement) {
            modal.parentElement.remove();
        }
    }

    /**
     * Envia para os contatos selecionados
     */
    sendToSelected(method, contacts) {
        this.closeSendModal();

        // Simula o envio (aqui você implementaria a lógica real)
        if (method === 'whatsapp') {
            // Abre WhatsApp Web para cada contato
            contacts.forEach((contact, index) => {
                setTimeout(() => {
                    const message = encodeURIComponent(`Olá ${contact.name}, tudo bem?`);
                    window.open(`https://wa.me/${contact.whatsapp}?text=${message}`, '_blank');
                }, index * 1000); // Delay de 1 segundo entre cada abertura
            });
            this.showToast('success', `Abrindo ${contacts.length} conversas no WhatsApp...`);
        } else if (method === 'email') {
            // Abre cliente de email com todos os destinatários
            const emails = contacts.map(c => c.email).join(',');
            window.open(`mailto:${emails}?subject=Contato&body=Olá`);
            this.showToast('success', `Abrindo cliente de email para ${contacts.length} destinatários`);
        } else if (method === 'document') {
            this.showToast('info', `Preparando documentos para ${contacts.length} destinatários...`);
            // Aqui você implementaria o envio de documentos
        }
    }

    /**
     * Envia para um contato específico (botões individuais)
     */
    sendToContact(method, name, email, whatsapp) {
        if (method === 'whatsapp') {
            const message = encodeURIComponent(`Olá ${name}, tudo bem?`);
            window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
            this.showToast('success', `Abrindo WhatsApp para ${name}`);
        } else if (method === 'document') {
            this.showToast('info', `Enviando documento para ${name}...`);
        } else if (method === 'share') {
            this.showToast('info', `Compartilhando com ${name}...`);
        }
    }
}

// ============================================================================
// FUNÇÕES GLOBAIS
// ============================================================================

/**
 * Edita o cliente atual
 */
function editClient() {
    // Abre o modal de edição usando o gerenciador
    if (!window.editModalManager || !clientDetailsManager || !clientDetailsManager.client) {
        clientDetailsManager.showToast('error', 'Não foi possível abrir o modal de edição.');
        return;
    }
    window.editModalManager.openModal(clientDetailsManager.client);
}

/**
 * Imprime a página
 */
function printPage() {
    window.print();
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

// Aguarda o DOM estar carregado
document.addEventListener('DOMContentLoaded', () => {
    window.clientDetailsManager = new ClientDetailsManager();
});