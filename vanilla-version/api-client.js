const API_CONFIG = {
    // Usa baseURL relativa em produção (Render monolito) e localhost durante desenvolvimento.
    baseURL: (typeof window !== 'undefined' && window.API_BASE_URL)
        ? window.API_BASE_URL
        : (typeof location !== 'undefined' && location.origin.includes('localhost'))
            ? 'http://localhost:3000/api'
            : '/api',
    timeout: 10000 // 10 segundos
};

/**
 * Cliente da API para comunicação com o backend
 */
class ApiClient {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
    }

    /**
     * Faz uma requisição HTTP para a API
     * @param {string} endpoint - Endpoint da API
     * @param {Object} options - Opções da requisição (method, body, etc.)
     * @returns {Promise<Object>} Resposta da API
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = window.authManager.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            headers,
            ...options
        };

        try {
            console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ API Response:', data);
            return data;
        } catch (error) {
            console.error('❌ API Error:', error);
            
            // Se for erro de rede e for GET, podemos tentar fallback
            // Para POST/PUT/DELETE, devemos falhar pois são operações que alteram dados
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                console.warn('⚠️ API offline ou inacessível');
            }
            
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

/**
 * Instância global do cliente da API
 */
const apiClient = new ApiClient();

/**
 * ============================================================================ 
 * FUNÇÕES DA API - CLIENTES
 * ============================================================================ 
 */

/**
 * Buscar lista de clientes com filtros e paginação
 */
async function fetchClients(filters = {}) {
    try {
        const params = {
            page: filters.page || 1,
            limit: filters.limit || 10,
            search: filters.search || '',
            type: filters.type || '',
            city: filters.city || '',
            state: filters.state || '',
            status: filters.status || 'active'
        };

        // Remove parâmetros vazios
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null || params[key] === undefined) {
                delete params[key];
            }
        });

        return await apiClient.get('/clientes', params);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        throw error;
    }
}

/**
 * Buscar detalhes completos de um cliente (com todas as relações)
 */
async function fetchClientDetails(clientId) {
    try {
        if (!clientId) {
            throw new Error('ID do cliente é obrigatório');
        }

        // Usar endpoint /relatorio que traz equipe_pedagogica, corpo_docente, etc
        return await apiClient.get(`/clientes/${clientId}/relatorio`);
    } catch (error) {
        console.error('Erro ao buscar detalhes do cliente:', error);
        throw error;
    }
}

/**
 * Buscar sugestões para autocomplete de clientes
 */
async function fetchClientSuggestions(query, limit = 10) {
    try {
        if (!query || query.length < 2) {
            return { success: true, data: [] };
        }

        return await apiClient.get('/clientes/search/suggestions', { q: query, limit });
    } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
        return { success: true, data: [] }; // Retorna vazio em caso de erro
    }
}

/**
 * ============================================================================ 
 * FUNÇÕES DA API - SEGMENTOS EDUCACIONAIS
 * ============================================================================ 
 */

/**
 * Buscar todos os segmentos educacionais
 */
async function fetchEducationSegments() {
    try {
        return await apiClient.get('/segments');
    } catch (error) {
        console.error('Erro ao buscar segmentos educacionais:', error);
        throw error;
    }
}

/**
 * Buscar estatísticas dos segmentos
 */
async function fetchSegmentStatistics(clientId = null) {
    try {
        const params = clientId ? { client_id: clientId } : {};
        return await apiClient.get('/segments/statistics', params);
    } catch (error) {
        console.error('Erro ao buscar estatísticas dos segmentos:', error);
        throw error;
    }
}

/**
 * ============================================================================ 
 * UTILITÁRIOS
 * ============================================================================ 
 */

/**
 * Verificar se a API está disponível
 */
async function checkApiHealth() {
    try {
        const response = await fetch(`${API_CONFIG.baseURL.replace('/api', '')}/health`);
        const data = await response.json();
        return data.status === 'healthy';
    } catch (error) {
        console.warn('API não está disponível:', error.message);
        return false;
    }
}

/**
 * Formatar dados do cliente para compatibilidade com o frontend
 */
function formatClientData(apiData) {
    // Aceita tanto { data: {...} } quanto {...} diretamente
    let client = apiData && apiData.data ? apiData.data : apiData;
    
    if (!client || !client.id) return null;
    
    // Se vier no formato agregado (info_basicas, equipe_pedagogica, etc) - formato legado
    if (client.info_basicas) {
        const info = client.info_basicas;
        
        return {
            id: info.id,
            name: info.nome,
            type: info.tipo === 'Rede' ? 'network' : 'school',
            address: info.endereco,
            phone: info.telefone,
            cnpj: info.cnpj,
            city: info.cidade,
            state: info.uf,
            microRegion: info.microrregiao || '',
            invoiceSystem: info.invoice_system,
            observations: info.observations,
            status: info.status_sistema.toLowerCase(),
            createdAt: new Date(info.data_criacao),
            updatedAt: new Date(info.ultima_atualizacao),
            
            // Dados relacionados no formato novo
            educationalTeam: (client.equipe_pedagogica || []).map(eq => ({
                id: eq.id,
                role: eq.funcao,
                name: eq.nome,
                whatsapp: eq.zap || eq.whatsapp,
                email: eq.email,
                socialMedia: eq.rede_social || ''
            })),
            
            teachers: (client.corpo_docente || []).map(doc => ({
                id: doc.id,
                role: doc.funcao,
                name: doc.nome,
                whatsapp: doc.zap || doc.whatsapp,
                email: doc.email,
                school: doc.escola
            })),
            
            studentSegmentation: (client.rede_em_numeros || []).map(rn => ({
                id: rn.id,
                segment: rn.segmento,
                year: rn.ano_serie,
                quantity: rn.quantidade_alunos,
                zone: rn.zona
            })),
            
            schools: client.schools || [],
            
            // Totais
            totals: client.totals || {
                educationalTeam: (client.equipe_pedagogica || []).length,
                teachers: (client.corpo_docente || []).length,
                students: (client.rede_em_numeros || []).reduce((sum, rn) => sum + rn.quantidade_alunos, 0),
                schools: (client.schools || []).length,
                segments: (client.rede_em_numeros || []).length
            },
            
            // Total de estudantes calculado
            totalStudents: (client.rede_em_numeros || []).reduce((sum, rn) => sum + rn.quantidade_alunos, 0)
        };
    }
    
    // Mapeamento dos campos do backend para o frontend (novo endpoint /relatorio)
    return {
        id: client.id,
        name: client.nome,
        type: client.tipo,
        address: client.observacoes || '',
        phone: client.telefone || '',
        cnpj: client.cnpj || '',
        city: client.cidade || '',
        state: client.uf || '',
        microRegion: client.microrregiao || '',
        invoiceSystem: client.invoice_system || '',
        observations: client.observacoes || '',
        status: client.status || '',
        createdAt: client.created_at ? new Date(client.created_at) : '',
        updatedAt: client.updated_at ? new Date(client.updated_at) : '',
        
        // Dados relacionados - agora mapeando corretamente
        educationalTeam: (client.equipe_pedagogica || []).map(eq => ({
            id: eq.id,
            role: eq.funcao,
            name: eq.nome,
            whatsapp: eq.zap || '',
            email: eq.email,
            socialMedia: eq.rede_social || ''
        })),
        
        teachers: (client.corpo_docente || []).map(doc => ({
            id: doc.id,
            role: doc.funcao,
            name: doc.nome,
            whatsapp: doc.zap || '',
            email: doc.email,
            school: doc.escola || ''
        })),
        
        studentSegmentation: client.rede_em_numeros || [],
        schools: client.schools || [],
        
        // Totais
        totals: {
            educationalTeam: (client.equipe_pedagogica || []).length,
            teachers: (client.corpo_docente || []).length,
            students: 0,
            schools: 0,
            segments: 0
        },
        
        // Total de estudantes
        totalStudents: 0
    };
}

/**
 * ============================================================================ 
 * FUNÇÕES PARA COMPATIBILIDADE COM CÓDIGO EXISTENTE
 * ============================================================================ 
 */

/**
 * Função compatível com o código existente - busca todos os clientes
 */
async function getAllClients() {
    try {
        const result = await fetchClients({ limit: 100 }); // Buscar muitos registros
        return result.data || [];
    } catch (error) {
        console.error('Erro ao buscar todos os clientes:', error);
        return []; // Sem fallback - apenas dados reais
    }
}

/**
 * Função compatível - busca cliente por ID
 */
async function getClientById(id) {
    try {
        const result = await fetchClientDetails(id);
        return formatClientData(result);
    } catch (error) {
        console.error(`Erro ao buscar cliente ${id}:`, error);
        return null; // Sem fallback - apenas dados reais
    }
}

/**
 * ============================================================================ 
 * FUNÇÕES DA API - RELATÓRIOS
 * ============================================================================ 
 */

/**
 * Buscar templates de relatórios disponíveis
 */
async function fetchReportTemplates(filters = {}) {
    try {
        console.log('🔍 Buscando templates de relatórios...');
        const result = await apiClient.get('/reports/templates', filters);
        return result;
    } catch (error) {
        console.error('Erro ao buscar templates de relatórios:', error);
        // Retornar templates mock como fallback
        return getMockReportTemplates();
    }
}

/**
 * Obter preview de dados de um relatório
 */
async function fetchReportPreview(templateCode, options = {}) {
    try {
        console.log(`🔍 Gerando preview do relatório: ${templateCode}`);
        const result = await apiClient.get(`/reports/templates/${templateCode}/preview`, options);
        return result;
    } catch (error) {
        console.error('Erro ao gerar preview do relatório:', error);
        // Retornar preview mock como fallback
        return getMockReportPreview(templateCode);
    }
}

/**
 * Gerar relatório
 */
async function generateReport(reportConfig) {
    try {
        console.log('📊 Gerando relatório...', reportConfig);
        const result = await apiClient.post('/reports/generate', reportConfig);
        return result;
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        // Simular geração para demonstração
        return {
            success: true,
            report_id: Math.floor(Math.random() * 1000),
            status: 'processing',
            message: 'Relatório sendo processado (modo simulação)'
        };
    }
}

/**
 * Verificar status do relatório
 */
async function checkReportStatus(reportId) {
    try {
        console.log(`🔍 Verificando status do relatório: ${reportId}`);
        const result = await apiClient.get(`/reports/status/${reportId}`);
        return result;
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        // Simular status completo após alguns segundos
        return {
            success: true,
            report: {
                id: reportId,
                status: 'completed',
                title: 'Relatório Simulado',
                format: 'pdf',
                generated_at: new Date().toISOString()
            }
        };
    }
}

/**
 * Fazer download do relatório
 */
async function downloadReport(reportId, fileName = null) {
    try {
        console.log(`⬇️ Fazendo download do relatório: ${reportId}`);
        
        const blob = await apiClient.downloadReport(reportId);
        
        // Criar URL temporária para download
        const url = window.URL.createObjectURL(blob);
        
        // Criar elemento de link para download
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || `relatorio_${reportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Limpar URL temporária
        window.URL.revokeObjectURL(url);
        
        return { success: true, message: 'Download concluído' };
        
    } catch (error) {
        console.error('Erro no download:', error);
        // Simular download para demonstração
        const content = `Relatório ID: ${reportId}\nGerado em: ${new Date().toLocaleString()}\n\nEste é um relatório simulado para demonstração.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || `relatorio_simulado_${reportId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        return { success: true, message: 'Download simulado concluído' };
    }
}

/**
 * Buscar histórico de relatórios
 */
async function fetchReportsHistory(options = {}) {
    try {
        console.log('🔍 Buscando histórico de relatórios...');
        const result = await apiClient.get('/reports/history', options);
        return result;
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        // Retornar histórico mock como fallback
        return getMockReportsHistory();
    }
}

/**
 * ============================================================================ 
 * DADOS MOCK PARA RELATÓRIOS (FALLBACK)
 * ============================================================================ 
 */

function getMockReportTemplates() {
    return {
        success: true,
        templates: {
            'Executivo': [
                {
                    id: 1,
                    template_code: 'dashboard_executive',
                    template_name: 'Dashboard Executivo',
                    category: 'Executivo',
                    description: 'Visão geral completa com principais indicadores',
                    format_options: ['html', 'pdf', 'excel'],
                    parameters: { filters: ['state', 'year', 'client_type'] }
                }
            ],
            'Clientes': [
                {
                    id: 2,
                    template_code: 'clients_by_state',
                    template_name: 'Clientes por Estado',
                    category: 'Clientes',
                    description: 'Distribuição detalhada de clientes por estado',
                    format_options: ['html', 'pdf', 'excel', 'csv'],
                    parameters: { filters: ['state', 'client_type'] }
                }
            ]
        },
        total: 2
    };
}

function getMockReportPreview(templateCode) {
    const previews = {
        'dashboard_executive': {
            success: true,
            template: {
                name: 'Dashboard Executivo',
                category: 'Executivo',
                description: 'Visão geral completa com principais indicadores'
            },
            preview_data: [
                { total_clients: 127, total_students: 45673, states_covered: 23, avg_ideb: 5.8 }
            ],
            columns: [
                { name: 'total_clients', type: 'integer' },
                { name: 'total_students', type: 'integer' },
                { name: 'states_covered', type: 'integer' },
                { name: 'avg_ideb', type: 'numeric' }
            ]
        },
        'clients_by_state': {
            success: true,
            template: {
                name: 'Clientes por Estado',
                category: 'Clientes',
                description: 'Distribuição detalhada de clientes por estado'
            },
            preview_data: [
                { state_code: 'SP', state_name: 'São Paulo', total_clients: 45, total_students: 18234 },
                { state_code: 'RJ', state_name: 'Rio de Janeiro', total_clients: 23, total_students: 9876 }
            ],
            columns: [
                { name: 'state_code', type: 'varchar' },
                { name: 'state_name', type: 'varchar' },
                { name: 'total_clients', type: 'integer' },
                { name: 'total_students', type: 'integer' }
            ]
        }
    };
    
    return previews[templateCode] || {
        success: false,
        error: 'Template não encontrado'
    };
}

function getMockReportsHistory() {
    return {
        success: true,
        reports: [
            {
                id: 1,
                report_title: 'Dashboard Executivo - Novembro 2024',
                template_name: 'Dashboard Executivo',
                category: 'Executivo',
                format: 'pdf',
                status: 'completed',
                generated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                file_size: 245678,
                download_count: 3
            },
            {
                id: 2,
                report_title: 'Clientes por Estado - Análise Regional',
                template_name: 'Clientes por Estado',
                category: 'Clientes',
                format: 'excel',
                status: 'completed',
                generated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                file_size: 89456,
                download_count: 1
            }
        ],
        page: 1,
        limit: 20
    };
}

// Exportar funções para uso global
window.apiClient = apiClient;
window.fetchClients = fetchClients;
window.fetchClientDetails = fetchClientDetails;
window.fetchClientSuggestions = fetchClientSuggestions;
window.fetchEducationSegments = fetchEducationSegments;
window.fetchSegmentStatistics = fetchSegmentStatistics;
window.checkApiHealth = checkApiHealth;
window.getAllClients = getAllClients;
window.getClientById = getClientById;

// Exportar funções de relatórios
window.fetchReportTemplates = fetchReportTemplates;
window.fetchReportPreview = fetchReportPreview;
window.generateReport = generateReport;
window.checkReportStatus = checkReportStatus;
window.downloadReport = downloadReport;
window.fetchReportsHistory = fetchReportsHistory;