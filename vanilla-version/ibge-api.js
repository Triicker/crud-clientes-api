// ============================================================================
// INTEGRAÇÃO COM API DO IBGE - LOCALIDADES
// ============================================================================

/**
 * Classe para gerenciar integração com API de Localidades do IBGE
 */
class IBGEApiClient {
    constructor() {
        this.baseURL = 'https://servicodados.ibge.gov.br/api/v1/localidades';
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutos
    }

    /**
     * Método genérico para fazer requisições com cache
     */
    async request(endpoint, cacheKey) {
        try {
            // Verificar cache
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                const now = Date.now();
                
                if (now - cached.timestamp < this.cacheTimeout) {
                    console.log(`📦 Cache hit para ${cacheKey}`);
                    return cached.data;
                } else {
                    // Cache expirado
                    this.cache.delete(cacheKey);
                }
            }

            console.log(`🌐 Buscando dados do IBGE: ${endpoint}`);
            
            const response = await fetch(`${this.baseURL}${endpoint}`);
            
            if (!response.ok) {
                throw new Error(`Erro na API do IBGE: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Salvar no cache
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
            
        } catch (error) {
            console.error(`❌ Erro ao buscar dados do IBGE (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * Buscar todos os estados brasileiros
     */
    async getEstados() {
        const data = await this.request('/estados?orderBy=nome', 'estados');
        
        return data.map(estado => ({
            id: estado.id,
            sigla: estado.sigla,
            nome: estado.nome,
            regiao: estado.regiao.nome
        }));
    }

    /**
     * Buscar municípios de um estado específico
     */
    async getMunicipiosPorEstado(uf) {
        if (!uf) throw new Error('UF é obrigatório');
        
        const data = await this.request(`/estados/${uf}/municipios?orderBy=nome`, `municipios_${uf}`);
        
        return data.map(municipio => ({
            id: municipio.id,
            nome: municipio.nome,
            microrregiao: municipio.microrregiao?.nome || null,
            mesorregiao: municipio.microrregiao?.mesorregiao?.nome || null,
            uf: uf
        }));
    }

    /**
     * Buscar microrregiões de um estado
     */
    async getMicrorregioesPorEstado(uf) {
        if (!uf) throw new Error('UF é obrigatório');
        
        const data = await this.request(`/estados/${uf}/microrregioes?orderBy=nome`, `microrregioes_${uf}`);
        
        return data.map(microrregiao => ({
            id: microrregiao.id,
            nome: microrregiao.nome,
            mesorregiao: microrregiao.mesorregiao?.nome || null,
            uf: uf
        }));
    }

    /**
     * Buscar mesorregiões de um estado
     */
    async getMesorregioesPorEstado(uf) {
        if (!uf) throw new Error('UF é obrigatório');
        
        const data = await this.request(`/estados/${uf}/mesorregioes?orderBy=nome`, `mesorregioes_${uf}`);
        
        return data.map(mesorregiao => ({
            id: mesorregiao.id,
            nome: mesorregiao.nome,
            uf: uf
        }));
    }

    /**
     * Buscar detalhes de um município específico
     */
    async getMunicipioPorId(municipioId) {
        if (!municipioId) throw new Error('ID do município é obrigatório');
        
        const data = await this.request(`/municipios/${municipioId}`, `municipio_${municipioId}`);
        
        return {
            id: data.id,
            nome: data.nome,
            microrregiao: data.microrregiao?.nome || null,
            mesorregiao: data.microrregiao?.mesorregiao?.nome || null,
            uf: data.microrregiao?.mesorregiao?.UF?.sigla || null,
            estado: data.microrregiao?.mesorregiao?.UF?.nome || null,
            regiao: data.microrregiao?.mesorregiao?.UF?.regiao?.nome || null
        };
    }

    /**
     * Buscar todos os municípios (com paginação opcional)
     */
    async getTodosMunicipios() {
        console.warn('⚠️ Atenção: Buscar todos os municípios pode ser lento (5570+ registros)');
        
        const data = await this.request('/municipios?orderBy=nome', 'todos_municipios');
        
        return data.map(municipio => ({
            id: municipio.id,
            nome: municipio.nome,
            microrregiao: municipio.microrregiao?.nome || null,
            mesorregiao: municipio.microrregiao?.mesorregiao?.nome || null,
            uf: municipio.microrregiao?.mesorregiao?.UF?.sigla || null,
            estado: municipio.microrregiao?.mesorregiao?.UF?.nome || null,
            regiao: municipio.microrregiao?.mesorregiao?.UF?.regiao?.nome || null
        }));
    }

    /**
     * Limpar cache (útil para forçar atualização)
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache do IBGE limpo');
    }

    /**
     * Verificar status do cache
     */
    getCacheStatus() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            timeout: this.cacheTimeout / 1000 / 60 // em minutos
        };
    }
}

/**
 * ============================================================================
 * FUNÇÕES DE CONVENIÊNCIA E HELPERS
 * ============================================================================
 */

/**
 * Instância global do cliente IBGE
 */
const ibgeApiClient = new IBGEApiClient();

/**
 * Função helper para popular select de estados
 */
async function populateEstadosSelect(selectElement, includeEmpty = true) {
    try {
        if (includeEmpty) {
            selectElement.innerHTML = '<option value="">Todos os Estados</option>';
        } else {
            selectElement.innerHTML = '<option value="">Carregando estados...</option>';
        }

        const estados = await ibgeApiClient.getEstados();
        
        if (!includeEmpty) {
            selectElement.innerHTML = '<option value="">Selecione um estado</option>';
        }
        
        estados.forEach(estado => {
            const option = document.createElement('option');
            option.value = estado.sigla;
            option.textContent = `${estado.sigla} - ${estado.nome}`;
            option.dataset.regiaoNome = estado.regiao;
            selectElement.appendChild(option);
        });

        console.log(`✅ ${estados.length} estados carregados`);
        return estados;
        
    } catch (error) {
        console.error('❌ Erro ao carregar estados:', error);
        selectElement.innerHTML = '<option value="">Erro ao carregar estados</option>';
        throw error;
    }
}

/**
 * Função helper para popular select de municípios por estado
 */
async function populateMunicipiosSelect(selectElement, uf, includeEmpty = true) {
    try {
        if (!uf) {
            if (includeEmpty) {
                selectElement.innerHTML = '<option value="">Todas as Cidades</option>';
            } else {
                selectElement.innerHTML = '<option value="">Selecione um estado primeiro</option>';
            }
            return [];
        }

        selectElement.innerHTML = '<option value="">Carregando cidades...</option>';
        selectElement.disabled = true;

        const municipios = await ibgeApiClient.getMunicipiosPorEstado(uf);
        
        selectElement.innerHTML = '';
        selectElement.disabled = false;
        
        if (includeEmpty) {
            selectElement.innerHTML = '<option value="">Todas as Cidades</option>';
        } else {
            selectElement.innerHTML = '<option value="">Selecione uma cidade</option>';
        }
        
        municipios.forEach(municipio => {
            const option = document.createElement('option');
            option.value = municipio.id;
            option.textContent = municipio.nome;
            option.dataset.microrregiao = municipio.microrregiao || '';
            option.dataset.mesorregiao = municipio.mesorregiao || '';
            selectElement.appendChild(option);
        });

        console.log(`✅ ${municipios.length} municípios carregados para ${uf}`);
        return municipios;
        
    } catch (error) {
        console.error(`❌ Erro ao carregar municípios de ${uf}:`, error);
        selectElement.innerHTML = '<option value="">Erro ao carregar cidades</option>';
        selectElement.disabled = false;
        throw error;
    }
}

/**
 * Função helper para popular select de microrregiões por estado
 */
async function populateMicroregioesSelect(selectElement, uf, includeEmpty = true) {
    try {
        if (!uf) {
            if (includeEmpty) {
                selectElement.innerHTML = '<option value="">Todas as Microrregiões</option>';
            } else {
                selectElement.innerHTML = '<option value="">Selecione um estado primeiro</option>';
            }
            return [];
        }

        selectElement.innerHTML = '<option value="">Carregando microrregiões...</option>';
        selectElement.disabled = true;

        const microrregioes = await ibgeApiClient.getMicrorregioesPorEstado(uf);
        
        selectElement.innerHTML = '';
        selectElement.disabled = false;
        
        if (includeEmpty) {
            selectElement.innerHTML = '<option value="">Todas as Microrregiões</option>';
        } else {
            selectElement.innerHTML = '<option value="">Selecione uma microrregião</option>';
        }
        
        microrregioes.forEach(microrregiao => {
            const option = document.createElement('option');
            option.value = microrregiao.id;
            option.textContent = microrregiao.nome;
            option.dataset.mesorregiao = microrregiao.mesorregiao || '';
            selectElement.appendChild(option);
        });

        console.log(`✅ ${microrregioes.length} microrregiões carregadas para ${uf}`);
        return microrregioes;
        
    } catch (error) {
        console.error(`❌ Erro ao carregar microrregiões de ${uf}:`, error);
        selectElement.innerHTML = '<option value="">Erro ao carregar microrregiões</option>';
        selectElement.disabled = false;
        throw error;
    }
}

/**
 * Exportar para uso global
 */
window.ibgeApiClient = ibgeApiClient;
window.populateEstadosSelect = populateEstadosSelect;
window.populateMunicipiosSelect = populateMunicipiosSelect;
window.populateMicroregioesSelect = populateMicroregioesSelect;