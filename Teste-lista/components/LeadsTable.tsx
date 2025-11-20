import React from 'react';
import type { LeadResult } from '../types';
import CopyButton from './CopyButton';

interface LeadsTableProps {
  data: LeadResult[];
  onDetails: (name: string, location: string) => void;
}

const LeadsTable: React.FC<LeadsTableProps> = ({ data, onDetails }) => {
  
  const handleAddClient = async (item: LeadResult) => {
    // Parse Localidade
    let cidade = '';
    let uf = '';
    if (item.localidade) {
        const parts = item.localidade.split(',');
        if (parts.length >= 2) {
            cidade = parts[0].trim();
            uf = parts[1].trim();
        } else {
            cidade = item.localidade;
        }
    }

    // Construct Payload
    let obs = item.observacoes || '';
    if (item.contatoNome) {
        obs += `\nContato Relevante: ${item.contatoNome} - ${item.contatoCargo || ''}`;
    }
    if (item.email) {
        obs += `\nEmail: ${item.email}`;
    }
    if (item.website) {
        obs += `\nWebsite: ${item.website}`;
    }
    if (item.endereco) {
        obs += `\nEndereço: ${item.endereco}`;
    }

    const payload = {
        nome: item.entidade,
        tipo: item.tipo,
        cnpj: item.cnpj || '',
        cidade: cidade,
        uf: uf,
        telefone: item.contatoPublico || '',
        observacoes: obs.trim()
    };

    if (!payload.nome || !payload.cnpj) {
        alert('Atenção: Nome e CNPJ são obrigatórios para cadastrar o cliente.');
        if (!confirm('Deseja tentar cadastrar mesmo assim?')) {
            return;
        }
    } else {
        if (!confirm(`Deseja adicionar o cliente "${payload.nome}" ao sistema?`)) {
            return;
        }
    }

    try {
        const response = await fetch('/api/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('Cliente adicionado com sucesso!');
        } else if (response.status === 409) {
            alert('Este cliente já está cadastrado no sistema (CNPJ duplicado).');
        } else {
            const errorData = await response.json();
            alert(`Erro ao adicionar cliente: ${errorData.erro || 'Erro desconhecido'}`);
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro de conexão ao adicionar cliente.');
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-md">
      <table className="w-full text-sm text-left text-slate-600">
        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
          <tr>
            <th scope="col" className="px-6 py-3 font-bold">Entidade</th>
            <th scope="col" className="px-6 py-3 font-bold">Contato Relevante</th>
            <th scope="col" className="px-6 py-3 font-bold">Informações de Contato</th>
            <th scope="col" className="px-6 py-3 font-bold">Observações</th>
            <th scope="col" className="px-6 py-3 font-bold text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="bg-white border-b hover:bg-slate-50 transition-colors duration-200">
              <td className="px-6 py-4 font-medium text-slate-900 min-w-[250px] align-top">
                <div className="font-bold text-base mb-1">{item.entidade}</div>
                <div className="text-xs text-slate-500 mb-1">{item.tipo}</div>
                <div className="text-xs text-slate-500 mb-2">{item.localidade}</div>
                {item.cnpj && (
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-600 text-xs bg-indigo-50 px-2 py-1 rounded">{item.cnpj}</span>
                        <CopyButton textToCopy={item.cnpj} />
                    </div>
                )}
              </td>
              <td className="px-6 py-4 min-w-[200px] align-top">
                {item.contatoNome ? (
                  <>
                    <div className="font-semibold text-slate-800">{item.contatoNome}</div>
                    <div className="text-xs text-slate-500">{item.contatoCargo}</div>
                  </>
                ) : (
                  <span className="text-slate-400 italic">N/A</span>
                )}
              </td>
              <td className="px-6 py-4 min-w-[250px] align-top">
                <div className="flex flex-col gap-2">
                    {item.website && (
                        <div className="flex items-center gap-2 text-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <a href={item.website.startsWith('http') ? item.website : `https://${item.website}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate max-w-[200px]">
                                {item.website}
                            </a>
                        </div>
                    )}
                    {item.email && (
                        <div className="flex items-center gap-2 text-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate max-w-[180px]" title={item.email}>{item.email}</span>
                            <CopyButton textToCopy={item.email} />
                        </div>
                    )}
                    {item.contatoPublico && (
                        <div className="flex items-center gap-2 text-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{item.contatoPublico}</span>
                            <CopyButton textToCopy={item.contatoPublico} />
                        </div>
                    )}
                    {!item.website && !item.email && !item.contatoPublico && (
                        <span className="text-slate-400 italic text-xs">Nenhuma informação disponível</span>
                    )}
                </div>
              </td>
              <td className="px-6 py-4 min-w-[200px] align-top">
                <p className="text-xs text-slate-600 leading-relaxed">
                    {item.observacoes || <span className="text-slate-400 italic">Sem observações</span>}
                </p>
              </td>
              <td className="px-6 py-4 align-top">
                <div className="flex flex-col items-center justify-start gap-2">
                    <button onClick={() => onDetails(item.entidade, item.localidade)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs py-1 px-3 rounded-md border border-indigo-200 hover:bg-indigo-50 transition-all w-full">
                        Ver Detalhes
                    </button>
                    
                    <button 
                        onClick={() => handleAddClient(item)}
                        className="text-green-600 hover:text-green-800 font-semibold text-xs py-1 px-3 rounded-md border border-green-200 hover:bg-green-50 transition-all w-full flex items-center justify-center gap-1"
                        title="Adicionar ao Sistema"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Adicionar
                    </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeadsTable;
