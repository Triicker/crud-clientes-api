import React from 'react';
import type { OrgaoResult } from '../types';
import CopyButton from './CopyButton';

interface OrgaosTableProps {
  data: OrgaoResult[];
  onDetails: (name: string, location: string) => void;
  onSuggestApproach: (orgao: string, iniciativas: string) => void;
}

const OrgaosTable: React.FC<OrgaosTableProps> = ({ data, onDetails, onSuggestApproach }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <p>Nenhum resultado encontrado. Tente ajustar os filtros de busca.</p>
      </div>
    );
  }

  const getPotencialBadge = (potencial: string) => {
    const styles = {
      'Alto': 'bg-red-100 text-red-800 border-red-300',
      'Médio': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Baixo': 'bg-green-100 text-green-800 border-green-300',
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 ${styles[potencial as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {potencial} Potencial
      </span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Órgão / Dossiê
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Potencial de Compra
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Contatos Chave
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Iniciativas e Notícias Recentes
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-slate-50 transition-colors duration-150">
              <td className="px-6 py-4">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.orgao}</p>
                    <p className="text-xs text-slate-500">{item.localidade}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded text-indigo-600 font-mono">
                      {item.cnpj}
                    </code>
                    <CopyButton text={item.cnpj} />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                {getPotencialBadge(item.potencialCompra)}
              </td>
              <td className="px-6 py-4">
                <div className="space-y-2">
                  {item.contatosChave && item.contatosChave.length > 0 ? (
                    item.contatosChave.map((contato, idx) => (
                      <div key={idx} className="text-sm">
                        <p className="font-medium text-slate-900">{contato.nome}</p>
                        <p className="text-xs text-slate-500">{contato.cargo}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sem contatos disponíveis</p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-700 line-clamp-3">{item.iniciativasRecentes}</p>
                  {item.fonteInformacao && (
                    <a
                      href={item.fonteInformacao}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Ver fonte
                    </a>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <button
                  onClick={() => onSuggestApproach(item.orgao, item.iniciativasRecentes)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
                  title="Gerar sugestões de abordagem com IA"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Sugerir Abordagem
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrgaosTable;
