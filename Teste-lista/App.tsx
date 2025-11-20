import React, { useState, useCallback, useEffect } from 'react';
import type { CnpjResult, LeadResult, OrgaoResult } from './types';
import { fetchCnpjs, fetchLeads, generateSalesApproach } from './services/geminiService';
import OrgaosTable from './components/OrgaosTable';
import LeadsTable from './components/LeadsTable';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import DetailsModal from './components/DetailsModal';
import ApproachModal from './components/ApproachModal';
import { exportToCsv } from './utils/export';

// Interfaces for IBGE API data
interface EstadoAPI {
  id: number;
  sigla: string;
  nome: string;
}
interface CidadeAPI {
  id: number;
  nome: string;
}

const tiposEntidade = [
  "Escola Privada", "Escola Pública Municipal", "Escola Pública Estadual", 
  "Prefeitura", "SEDUC (Secretaria Estadual)", "Secretaria Municipal de Educação", 
  "Livraria", "Distribuidor de material didático"
];

type SearchMode = 'cnpj' | 'leads';

interface SelectedEntity {
  name: string;
  location: string;
}

const ITEMS_PER_PAGE = 15;

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyEntered, setApiKeyEntered] = useState<boolean>(false);
  const [results, setResults] = useState<(OrgaoResult | LeadResult)[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('cnpj');

  // State for pagination
  const [visibleResultsCount, setVisibleResultsCount] = useState<number>(ITEMS_PER_PAGE);

  // State for IBGE API data
  const [estadosApi, setEstadosApi] = useState<EstadoAPI[]>([]);
  const [cidadesApi, setCidadesApi] = useState<CidadeAPI[]>([]);
  const [isCidadesLoading, setIsCidadesLoading] = useState<boolean>(false);

  // State for CNPJ search
  const [estado, setEstado] = useState<string>('');
  const [tipoOrgao, setTipoOrgao] = useState<string>('educacionais');

  // State for Leads search
  const [cidade, setCidade] = useState<string>('');
  const [tipoEntidade, setTipoEntidade] = useState<string>(tiposEntidade[0]);

  // State for Details Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);

  // State for Approach Modal
  const [isApproachModalOpen, setIsApproachModalOpen] = useState<boolean>(false);
  const [approachOrgao, setApproachOrgao] = useState<string>('');
  const [isApproachLoading, setIsApproachLoading] = useState<boolean>(false);
  const [approachSugestoes, setApproachSugestoes] = useState<string[] | null>(null);
  const [approachContexto, setApproachContexto] = useState<string | null>(null);
  const [approachError, setApproachError] = useState<string | null>(null);

  // Fetch states from IBGE API on component mount
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        if (!response.ok) throw new Error('Falha ao carregar estados.');
        const data = await response.json();
        setEstadosApi(data);
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar a lista de estados do IBGE.');
      }
    };
    fetchEstados();
  }, []);

  // Fetch cities from IBGE API when state changes
  useEffect(() => {
    if (estado) {
      const fetchCidades = async () => {
        setIsCidadesLoading(true);
        setCidadesApi([]);
        setCidade('');
        try {
          const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`);
          if (!response.ok) throw new Error('Falha ao carregar cidades.');
          const data = await response.json();
          setCidadesApi(data);
        } catch (err) {
          console.error(err);
          setError(`Não foi possível carregar as cidades para ${estado}.`);
        } finally {
          setIsCidadesLoading(false);
        }
      };
      fetchCidades();
    } else {
      setCidadesApi([]);
      setCidade('');
    }
  }, [estado]);

  const handleOpenDetails = (name: string, location: string) => {
    setSelectedEntity({ name, location });
    setIsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setIsModalOpen(false);
    setSelectedEntity(null);
  };

  const handleSuggestApproach = async (orgao: string, iniciativas: string) => {
    setApproachOrgao(orgao);
    setIsApproachModalOpen(true);
    setIsApproachLoading(true);
    setApproachError(null);
    setApproachSugestoes(null);
    setApproachContexto(null);

    try {
      const result = await generateSalesApproach(orgao, iniciativas, apiKey);
      setApproachSugestoes(result.frases);
      setApproachContexto(result.contexto);
    } catch (err) {
      if (err instanceof Error) {
        setApproachError(err.message);
      } else {
        setApproachError('Erro desconhecido ao gerar sugestões.');
      }
    } finally {
      setIsApproachLoading(false);
    }
  };

  const handleCloseApproachModal = () => {
    setIsApproachModalOpen(false);
    setApproachOrgao('');
    setApproachSugestoes(null);
    setApproachContexto(null);
    setApproachError(null);
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setApiKeyEntered(true);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!apiKey) {
      setError("A chave da API é necessária para fazer a busca.");
      setApiKeyEntered(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResults([]);
    setVisibleResultsCount(ITEMS_PER_PAGE); // Reset pagination on new search

    try {
      if (searchMode === 'cnpj') {
        if (!estado || !tipoOrgao) {
          throw new Error("Por favor, selecione um estado e defina o ramo de atividade.");
        }
        const data = await fetchCnpjs(apiKey, estado, tipoOrgao);
        setResults(data);
      } else { // searchMode === 'leads'
        if (!estado || !cidade || !tipoEntidade) {
            throw new Error("Por favor, preencha todos os campos para a busca de contatos.");
        }
        const data = await fetchLeads(apiKey, estado, cidade, tipoEntidade);
        setResults(data);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`Falha ao buscar dados: ${err.message}. Verifique sua chave de API e tente novamente.`);
      } else {
        setError('Ocorreu um erro desconhecido. Por favor, tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, searchMode, estado, tipoOrgao, cidade, tipoEntidade]);

  const handleExport = () => {
    if (results.length === 0) return;

    if (searchMode === 'cnpj') {
        const headers = ['Órgão', 'CNPJ', 'Localidade', 'Potencial de Compra', 'Contatos Chave', 'Iniciativas Recentes', 'Fonte'];
        const data = (results as OrgaoResult[]).map(item => [
            item.orgao,
            item.cnpj,
            item.localidade,
            item.potencialCompra,
            item.contatosChave.map(c => `${c.nome} (${c.cargo})`).join('; '),
            item.iniciativasRecentes,
            item.fonteInformacao || ''
        ]);
        const filename = `dossie_orgaos_${tipoOrgao.toLowerCase().replace(/\s/g, '_')}_${estado}.csv`;
        exportToCsv(filename, headers, data);
    } else { // searchMode === 'leads'
        const headers = ['Entidade', 'CNPJ', 'Tipo', 'Localidade', 'Nome Contato', 'Cargo Contato', 'Contato Público'];
        const data = (results as LeadResult[]).map(item => [
            item.entidade,
            item.cnpj,
            item.tipo,
            item.localidade,
            item.contatoNome,
            item.contatoCargo,
            item.contatoPublico
        ]);
        const filename = `leads_${tipoEntidade.toLowerCase().replace(/\s/g, '_')}_${cidade.toLowerCase().replace(/\s/g, '_')}_${estado}.csv`;
        exportToCsv(filename, headers, data);
    }
  };

  const handleLoadMore = () => {
    setVisibleResultsCount(prevCount => prevCount + ITEMS_PER_PAGE);
  };

  const paginatedResults = results.slice(0, visibleResultsCount);
  
  const renderCnpjForm = () => (
    <>
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md mb-8" role="alert">
        <p className="font-bold">🎯 Dossiê de Inteligência de Mercado</p>
        <p>Gere um relatório completo com análise de potencial de compra, decisores-chave e iniciativas recentes de órgãos públicos.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label htmlFor="estado-select" className="block text-sm font-medium text-slate-700 mb-2">Estado (UF)</label>
          <select id="estado-select" value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Selecione um estado</option>
            {estadosApi.map((e) => (<option key={e.id} value={e.sigla}>{e.nome}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="tipo-orgao-input" className="block text-sm font-medium text-slate-700 mb-2">Ramo de Atividade</label>
          <input type="text" id="tipo-orgao-input" value={tipoOrgao} onChange={(e) => setTipoOrgao(e.target.value)} placeholder="Ex: educacional, saúde" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
      </div>
    </>
  );

  const renderLeadsForm = () => (
    <>
        <div className="bg-green-50 border-l-4 border-green-500 text-green-800 p-4 rounded-md mb-8" role="alert">
            <p className="font-bold">Busca por Contatos (Leads)</p>
            <p>Mapeie contatos e perfis em entidades específicas. Preencha os campos para encontrar decisores e informações de contato públicas.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
                <label htmlFor="estado-lead-select" className="block text-sm font-medium text-slate-700 mb-2">Estado (UF)</label>
                <select id="estado-lead-select" value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Selecione um estado</option>
                    {estadosApi.map((e) => (<option key={e.id} value={e.sigla}>{e.nome}</option>))}
                </select>
            </div>
            <div>
                <label htmlFor="cidade-select" className="block text-sm font-medium text-slate-700 mb-2">Cidade</label>
                <select 
                    id="cidade-select" 
                    value={cidade} 
                    onChange={(e) => setCidade(e.target.value)} 
                    disabled={!estado || isCidadesLoading}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    <option value="">
                      {isCidadesLoading ? 'Carregando cidades...' : (estado ? 'Selecione uma cidade' : 'Selecione um estado primeiro')}
                    </option>
                    {cidadesApi.map(c => (<option key={c.id} value={c.nome}>{c.nome}</option>))}
                </select>
            </div>
            <div>
                <label htmlFor="tipo-entidade-select" className="block text-sm font-medium text-slate-700 mb-2">Tipo de Entidade</label>
                <select id="tipo-entidade-select" value={tipoEntidade} onChange={(e) => setTipoEntidade(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    {tiposEntidade.map(tipo => (<option key={tipo} value={tipo}>{tipo}</option>))}
                </select>
            </div>
        </div>
    </>
  );

  return (
    <div className="min-h-screen font-sans text-slate-800 bg-[#f6f8fc] py-8 md:py-12">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] p-8 sm:p-12">
          <div className="mb-6">
            <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300" title="Voltar para Clientes">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Voltar para Clientes</span>
            </a>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4 text-[#764ba2]">
            Buscador de Contatos e CNPJs
          </h1>
          <p className="text-center text-slate-500 text-lg mb-10">
            Utilize a inteligência artificial do Google Gemini para gerar listas de prospecção qualificadas.
          </p>
          <div className="">
            {!apiKeyEntered ? (
              <form onSubmit={handleApiKeySubmit} className="space-y-4 max-w-lg mx-auto">
                <h2 className="text-xl font-semibold text-slate-700">Chave da API do Google Gemini</h2>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md">
                    <p>Para usar esta aplicação, você precisa de uma chave de API do Google AI Studio.</p>
                </div>
                <div>
                  <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-700 mb-2">Sua API Key</label>
                  <input type="password" id="api-key-input" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Cole sua chave de API aqui" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                  <p className="text-xs text-slate-500 mt-1">Obtenha sua chave no <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google AI Studio</a>.</p>
                </div>
                <div className="text-center pt-4">
                    <button type="submit" className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 sm:px-8 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        Salvar e Continuar
                    </button>
                </div>
              </form>
            ) : (
              <>
                <div className="mb-8">
                    <div className="flex justify-center border-b border-slate-200">
                        <button onClick={() => setSearchMode('cnpj')} className={`px-6 py-3 font-semibold text-lg transition-colors duration-200 ${searchMode === 'cnpj' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-indigo-500'}`}>
                            Busca por Órgãos (CNPJ)
                        </button>
                        <button onClick={() => setSearchMode('leads')} className={`px-6 py-3 font-semibold text-lg transition-colors duration-200 ${searchMode === 'leads' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-500 hover:text-indigo-500'}`}>
                            Busca por Contatos (Leads)
                        </button>
                    </div>
                </div>

                {searchMode === 'cnpj' ? renderCnpjForm() : renderLeadsForm()}

                <div className="text-center">
                  <button onClick={handleSearch} disabled={isLoading} className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:cursor-not-allowed disabled:scale-100">
                    {isLoading ? <><LoadingSpinner /><span className="ml-2">Buscando...</span></> : <><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>Gerar Lista</>}
                  </button>
                </div>
                
                {error && <ErrorMessage message={error} />}
                
                {paginatedResults.length > 0 && !isLoading && (
                  <div className="mt-10">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:items-center mb-4">
                        <h2 className="text-2xl font-bold text-slate-700">Resultados Gerados</h2>
                        <button onClick={handleExport} className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Exportar para CSV
                        </button>
                    </div>
                    {searchMode === 'cnpj' ? <OrgaosTable data={paginatedResults as OrgaoResult[]} onDetails={handleOpenDetails} onSuggestApproach={handleSuggestApproach} /> : <LeadsTable data={paginatedResults as LeadResult[]} onDetails={handleOpenDetails} />}
                    
                    {visibleResultsCount < results.length && (
                      <div className="text-center mt-8">
                        <button 
                          onClick={handleLoadMore}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm"
                        >
                          Carregar Mais Resultados ({paginatedResults.length}/{results.length})
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="text-center mt-6">
                    <button onClick={() => { setApiKeyEntered(false); setResults([]); setError(null); setVisibleResultsCount(ITEMS_PER_PAGE); }} className="text-sm text-slate-500 hover:text-indigo-600 hover:underline">
                        Trocar API Key
                    </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      {isModalOpen && selectedEntity && (
        <DetailsModal 
            isOpen={isModalOpen}
            onClose={handleCloseDetails}
            apiKey={apiKey}
            entityName={selectedEntity.name}
            location={selectedEntity.location}
        />
      )}
      <ApproachModal
        isOpen={isApproachModalOpen}
        orgao={approachOrgao}
        isLoading={isApproachLoading}
        sugestoes={approachSugestoes}
        contexto={approachContexto}
        error={approachError}
        onClose={handleCloseApproachModal}
      />
    </div>
  );
};

export default App;
