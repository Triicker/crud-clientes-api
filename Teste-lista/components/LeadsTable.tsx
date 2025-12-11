/**
 * ================================================================================
 * LEADS TABLE COMPONENT - Componente para Exibição e Adição de Leads
 * ================================================================================
 * 
 * PROPÓSITO:
 * Este componente exibe uma tabela de leads obtidos via pesquisa do Gemini AI
 * e permite adicionar esses leads ao banco de dados como clientes reais.
 * 
 * TIPOS DE DADOS IMPORTANTES (de types.ts):
 * - LeadResult: { entidade, cnpj?, tipo, localidade, contatoNome?, contatoCargo?,
 *                contatoPublico?, endereco?, website?, email?, corpoDocente?, observacoes? }
 * 
 * MAPEAMENTO LeadResult → Cliente:
 * - entidade → nome (nome do cliente)
 * - localidade → cidade + uf (extraído via regex "Cidade, UF")
 * - contatoPublico → telefone
 * - tipo → tipo
 * - observacoes, email, website → concatenados em observacoes
 * 
 * ================================================================================
 */

import React, { useState, useEffect } from 'react';
import type { LeadResult } from '../types';

// ============================================================================
// INTERFACES
// ============================================================================

interface LeadsTableProps {
  data: LeadResult[];
  onDetails?: (name: string, location: string) => void;
  onAddClient?: (lead: LeadResult, clienteId: number) => void;
  apiBaseUrl?: string;
}

interface CorpoDocenteMember {
  funcao: string;
  nome: string;
  zap?: string;
  email?: string;
  escola?: string;
}

// ============================================================================
// FUNÇÕES AUXILIARES - Extração de Dados
// ============================================================================

/**
 * Extrai cidade e UF da string localidade
 * Exemplos: "Salvador, BA" → { cidade: "Salvador", uf: "BA" }
 *           "São Paulo - SP" → { cidade: "São Paulo", uf: "SP" }
 */
const parseLocalidade = (localidade: string | undefined): { cidade: string | null; uf: string | null } => {
  if (!localidade) return { cidade: null, uf: null };
  
  // Tenta padrão "Cidade, UF" ou "Cidade - UF"
  const match = localidade.match(/^(.+?)[,\-]\s*([A-Z]{2})$/i);
  if (match) {
    return { cidade: match[1].trim(), uf: match[2].toUpperCase() };
  }
  
  // Se não casar, retorna localidade como cidade
  return { cidade: localidade.trim(), uf: null };
};

/**
 * Parseia string de corpo docente do Gemini em array estruturado
 */
const parseCorpoDocente = (corpoDocenteString: string | undefined, escolaNome: string): CorpoDocenteMember[] => {
  if (!corpoDocenteString || corpoDocenteString.trim() === '') {
    return [];
  }

  const members: CorpoDocenteMember[] = [];
  
  // Pattern: "Cargo: Nome (email/telefone)"
  const cargoNomePattern = /(?:diretor|coordenador|vice|secretário|pedagogo|orientador)[a-z]*[:\s]+([A-Za-zÀ-ÿ\s]+?)(?:\s*\(([^)]+)\))?(?=[,;.]|$)/gi;
  
  let match;
  while ((match = cargoNomePattern.exec(corpoDocenteString)) !== null) {
    const fullMatch = match[0];
    const nome = match[1]?.trim();
    const extraInfo = match[2]?.trim();
    
    if (nome && nome.length > 2) {
      let funcao = 'Professor';
      const lowerMatch = fullMatch.toLowerCase();
      
      if (lowerMatch.includes('diretor')) funcao = 'Diretor';
      else if (lowerMatch.includes('vice')) funcao = 'Vice-Diretor';
      else if (lowerMatch.includes('coordenador')) funcao = 'Coordenador';
      else if (lowerMatch.includes('secretário')) funcao = 'Secretário';
      else if (lowerMatch.includes('pedagogo')) funcao = 'Pedagogo';
      else if (lowerMatch.includes('orientador')) funcao = 'Orientador';
      
      let email: string | undefined;
      let zap: string | undefined;
      
      if (extraInfo) {
        if (extraInfo.includes('@')) {
          email = extraInfo;
        } else if (/[\d\-\(\)]+/.test(extraInfo)) {
          zap = extraInfo;
        }
      }
      
      members.push({ funcao, nome, email, zap, escola: escolaNome });
    }
  }
  
  // Se não encontrou nada específico, retorna vazio para não poluir o banco
  if (members.length === 0) {
    return [];
  }
  
  return members;
};

/**
 * Monta string de observações com dados extras do lead
 */
const buildObservacoes = (lead: LeadResult): string => {
  const parts: string[] = [];
  
  if (lead.observacoes) parts.push(lead.observacoes);
  if (lead.email) parts.push(`📧 Email: ${lead.email}`);
  if (lead.website) parts.push(`🌐 Website: ${lead.website}`);
  if (lead.endereco) parts.push(`📍 Endereço: ${lead.endereco}`);
  if (lead.contatoNome && lead.contatoCargo) {
    parts.push(`👤 Contato: ${lead.contatoNome} (${lead.contatoCargo})`);
  }
  if (lead.corpoDocente) parts.push(`📚 Corpo Docente: ${lead.corpoDocente}`);
  
  parts.push(`\n[Adicionado via Gemini Search em ${new Date().toLocaleDateString('pt-BR')}]`);
  
  return parts.join('\n');
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const LeadsTable: React.FC<LeadsTableProps> = ({ 
  data: leads = [], 
  onDetails,
  onAddClient,
  apiBaseUrl = 'http://localhost:3000'
}) => {
  const [localLeads, setLocalLeads] = useState<LeadResult[]>([]);
  const [addingLead, setAddingLead] = useState<string | null>(null);
  const [addedLeads, setAddedLeads] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  const handleCnpjChange = (index: number, newCnpj: string) => {
    const updated = [...localLeads];
    updated[index] = { ...updated[index], cnpj: newCnpj };
    setLocalLeads(updated);
  };

  // ==========================================================================
  // Criar registros de corpo docente
  // ==========================================================================
  const createCorpoDocenteRecords = async (clienteId: number, members: CorpoDocenteMember[]): Promise<number> => {
    let successCount = 0;
    
    for (const member of members) {
      try {
        const response = await fetch(`${apiBaseUrl}/api/docentes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...member, cliente_id: clienteId }),
        });
        
        if (response.ok) {
          successCount++;
        }
      } catch (err) {
        console.error('[createCorpoDocenteRecords] Erro:', err);
      }
    }
    
    return successCount;
  };

  // ==========================================================================
  // Handler principal: adicionar lead como cliente
  // ==========================================================================
  const handleAddClient = async (lead: LeadResult) => {
    if (!lead.cnpj) {
      setError('Este lead não possui CNPJ válido para cadastro.');
      return;
    }

    setError(null);
    setSuccess(null);
    setAddingLead(lead.cnpj);

    // Extrai cidade/uf da localidade
    const { cidade, uf } = parseLocalidade(lead.localidade);

    try {
      // Verificar se CNPJ já existe
      const checkResponse = await fetch(`${apiBaseUrl}/api/clientes/cnpj/${lead.cnpj}`);
      
      if (checkResponse.ok) {
        // Cliente já existe
        const existingClient = await checkResponse.json();
        
        const shouldUpdate = window.confirm(
          `⚠️ Cliente já cadastrado!\n\n` +
          `Nome: ${existingClient.nome}\n` +
          `CNPJ: ${existingClient.cnpj}\n` +
          `Status: ${existingClient.status || 'N/A'}\n\n` +
          `Deseja ATUALIZAR os dados com as informações do lead?`
        );
        
        if (!shouldUpdate) {
          setError('Operação cancelada pelo usuário.');
          setAddingLead(null);
          return;
        }
        
        // Atualiza cliente existente
        // Preserva observações antigas e adiciona as novas
        const newObservacoes = existingClient.observacoes 
          ? `${existingClient.observacoes}\n\n--- Atualização Gemini (${new Date().toLocaleDateString()}) ---\n${buildObservacoes(lead)}`
          : buildObservacoes(lead);

        const updatePayload = {
          ...existingClient, // Mantém campos existentes (status, vendedor, etc.)
          nome: lead.entidade,
          tipo: lead.tipo || existingClient.tipo || 'Escola',
          cidade: cidade,
          uf: uf,
          telefone: lead.contatoPublico || existingClient.telefone,
          observacoes: newObservacoes,
          cnpj: lead.cnpj // Garante que o CNPJ vai no payload
        };

        const updateResponse = await fetch(`${apiBaseUrl}/api/clientes/${existingClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        });

        if (!updateResponse.ok) {
          throw new Error(`Erro ao atualizar: ${updateResponse.status}`);
        }

        // Adiciona corpo docente
        let corpoDocenteCount = 0;
        if (lead.corpoDocente) {
          const members = parseCorpoDocente(lead.corpoDocente, lead.entidade);
          if (members.length > 0) {
            corpoDocenteCount = await createCorpoDocenteRecords(existingClient.id, members);
          }
        }

        setAddedLeads(prev => new Set(prev).add(lead.cnpj!));
        let msg = `✅ Cliente "${lead.entidade}" atualizado com sucesso!`;
        if (corpoDocenteCount > 0) {
          msg += `\n📚 ${corpoDocenteCount} registro(s) de corpo docente criado(s).`;
        }
        setSuccess(msg);
        
      } else if (checkResponse.status === 404) {
        // Cliente não existe - criar novo
        const payload = {
          nome: lead.entidade,
          tipo: lead.tipo || 'Escola',
          cnpj: lead.cnpj,
          cidade: cidade,
          uf: uf,
          telefone: lead.contatoPublico || null,
          observacoes: buildObservacoes(lead),
          status: 'Prospecção'
        };

        const response = await fetch(`${apiBaseUrl}/api/clientes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          if (response.status === 409) {
            throw new Error('CNPJ já cadastrado no sistema (409 Conflict)');
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.erro || `Erro ${response.status}`);
        }

        const newClient = await response.json();

        // Adiciona corpo docente
        let corpoDocenteCount = 0;
        if (lead.corpoDocente) {
          const members = parseCorpoDocente(lead.corpoDocente, lead.entidade);
          if (members.length > 0) {
            corpoDocenteCount = await createCorpoDocenteRecords(newClient.id, members);
          }
        }

        setAddedLeads(prev => new Set(prev).add(lead.cnpj!));
        let msg = `✅ Cliente "${lead.entidade}" adicionado com sucesso! (ID: ${newClient.id})`;
        if (corpoDocenteCount > 0) {
          msg += `\n📚 ${corpoDocenteCount} registro(s) de corpo docente criado(s).`;
        }
        setSuccess(msg);

        if (onAddClient) {
          onAddClient(lead, newClient.id);
        }
        
      } else {
        throw new Error(`Erro ao verificar CNPJ: ${checkResponse.status}`);
      }
      
    } catch (err) {
      console.error('[handleAddClient] Erro:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Falha ao adicionar cliente: ${errorMessage}`);
    } finally {
      setAddingLead(null);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  
  if (!leads || leads.length === 0) {
    return null;
  }

  return (
    <div className="leads-table-container" style={{ marginTop: '20px' }}>
      {/* Mensagens de Feedback */}
      {error && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#ffebee', 
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '16px',
          border: '1px solid #ef9a9a'
        }}>
          ❌ {error}
        </div>
      )}
      
      {success && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#e8f5e9', 
          color: '#2e7d32',
          borderRadius: '4px',
          marginBottom: '16px',
          border: '1px solid #a5d6a7',
          whiteSpace: 'pre-line'
        }}>
          {success}
        </div>
      )}

      {/* Tabela Principal */}
      <div style={{ overflowX: 'auto' }}>
        <table className="min-w-full" style={{ 
          borderCollapse: 'collapse', 
          width: '100%',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>
                Entidade
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>
                CNPJ
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>
                Tipo
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>
                Localidade
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>
                Contato
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>
                Corpo Docente
              </th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e9ecef', fontWeight: '600' }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {localLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Nenhum resultado encontrado. Tente outra pesquisa.
                </td>
              </tr>
            ) : (
              localLeads.map((lead: LeadResult, index: number) => (
              <tr 
                key={lead.cnpj || `lead-${index}`}
                style={{ 
                  borderBottom: '1px solid #e9ecef',
                  backgroundColor: addedLeads.has(lead.cnpj || '') ? '#e8f5e9' : 'white'
                }}
              >
                {/* Entidade */}
                <td style={{ padding: '12px', verticalAlign: 'top' }}>
                  <strong>{lead.entidade}</strong>
                  {lead.website && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
                        🌐 {lead.website}
                      </a>
                    </div>
                  )}
                </td>
                
                {/* CNPJ */}
                <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
                  {lead.cnpj && lead.cnpj !== 'N/A' ? (
                    lead.cnpj
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="Inserir CNPJ"
                        style={{
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          width: '130px',
                          outline: 'none'
                        }}
                        value={lead.cnpj || ''}
                        onChange={(e) => handleCnpjChange(index, e.target.value)}
                      />
                      <a 
                        href={`https://www.google.com/search?q=${encodeURIComponent(`${lead.entidade} ${lead.localidade} CNPJ caixa escolar conselho escolar`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Pesquisar CNPJ no Google"
                        style={{
                          textDecoration: 'none',
                          cursor: 'pointer',
                          fontSize: '16px',
                          filter: 'grayscale(100%)',
                          transition: 'filter 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.filter = 'none'}
                        onMouseOut={(e) => e.currentTarget.style.filter = 'grayscale(100%)'}
                      >
                        🔍
                      </a>
                    </div>
                  )}
                </td>
                
                {/* Tipo */}
                <td style={{ padding: '12px' }}>
                  <span style={{ 
                    backgroundColor: '#e3f2fd', 
                    color: '#1565c0', 
                    padding: '2px 8px', 
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {lead.tipo}
                  </span>
                </td>
                
                {/* Localidade */}
                <td style={{ padding: '12px' }}>
                  {lead.localidade}
                </td>
                
                {/* Contato */}
                <td style={{ padding: '12px', fontSize: '13px' }}>
                  {lead.contatoNome && (
                    <div><strong>{lead.contatoNome}</strong></div>
                  )}
                  {lead.contatoCargo && (
                    <div style={{ color: '#666' }}>{lead.contatoCargo}</div>
                  )}
                  {lead.contatoPublico && (
                    <div style={{ marginTop: '4px' }}>📞 {lead.contatoPublico}</div>
                  )}
                  {lead.email && (
                    <div style={{ marginTop: '4px' }}>📧 {lead.email}</div>
                  )}
                </td>
                
                {/* Corpo Docente */}
                <td style={{ padding: '12px', fontSize: '13px', maxWidth: '200px' }}>
                  {lead.corpoDocente ? (
                    <div style={{ 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      color: '#2e7d32'
                    }} title={lead.corpoDocente}>
                      📚 {lead.corpoDocente.substring(0, 50)}
                      {lead.corpoDocente.length > 50 && '...'}
                    </div>
                  ) : (
                    <span style={{ color: '#999' }}>N/A</span>
                  )}
                </td>
                
                {/* Ações */}
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {/* Botão Detalhes */}
                    {onDetails && (
                      <button
                        onClick={() => onDetails(lead.entidade, lead.localidade)}
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        title="Ver detalhes"
                      >
                        👁️
                      </button>
                    )}
                    
                    {/* Botão Adicionar */}
                    <button
                      onClick={() => handleAddClient(lead)}
                      disabled={!lead.cnpj || addingLead === lead.cnpj || addedLeads.has(lead.cnpj || '')}
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: addedLeads.has(lead.cnpj || '') 
                          ? '#e8f5e9' 
                          : !lead.cnpj 
                            ? '#f5f5f5' 
                            : '#e3f2fd',
                        color: addedLeads.has(lead.cnpj || '') 
                          ? '#2e7d32' 
                          : !lead.cnpj 
                            ? '#9e9e9e' 
                            : '#1565c0',
                        border: '1px solid transparent',
                        borderColor: addedLeads.has(lead.cnpj || '') 
                          ? '#c8e6c9' 
                          : !lead.cnpj 
                            ? '#e0e0e0' 
                            : '#bbdefb',
                        borderRadius: '8px',
                        cursor: !lead.cnpj || addedLeads.has(lead.cnpj || '') ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        boxShadow: !lead.cnpj ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease',
                        opacity: addingLead === lead.cnpj ? 0.7 : 1
                      }}
                      onMouseOver={(e) => {
                        if (lead.cnpj && !addedLeads.has(lead.cnpj)) {
                           e.currentTarget.style.transform = 'translateY(-1px)';
                           e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                        }
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = !lead.cnpj ? 'none' : '0 2px 4px rgba(0,0,0,0.05)';
                      }}
                      title={
                        !lead.cnpj 
                          ? 'Sem CNPJ' 
                          : addedLeads.has(lead.cnpj) 
                            ? 'Já adicionado' 
                            : 'Adicionar como cliente'
                      }
                    >
                      {addingLead === lead.cnpj 
                        ? '⏳' 
                        : addedLeads.has(lead.cnpj || '') 
                          ? '✓' 
                          : '＋'}
                    </button>
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Rodapé com estatísticas */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        color: '#666'
      }}>
        <span>📊 Total: {leads.length} lead(s)</span>
        <span>✅ Adicionados: {addedLeads.size}</span>
        <span>⏳ Pendentes: {leads.length - addedLeads.size}</span>
      </div>
    </div>
  );
};

export default LeadsTable;
