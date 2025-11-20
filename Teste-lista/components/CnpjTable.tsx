import React from 'react';
import type { CnpjResult } from '../types';
import CopyButton from './CopyButton';

interface CnpjTableProps {
  data: CnpjResult[];
  onDetails: (name: string, location: string) => void;
}

const CnpjTable: React.FC<CnpjTableProps> = ({ data, onDetails }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-md">
      <table className="w-full text-sm text-left text-slate-600">
        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
          <tr>
            <th scope="col" className="px-6 py-3 font-bold">
              Órgão / Entidade
            </th>
            <th scope="col" className="px-6 py-3 font-bold">
              CNPJ
            </th>
            <th scope="col" className="px-6 py-3 font-bold text-center">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="bg-white border-b hover:bg-slate-50 transition-colors duration-200">
              <td className="px-6 py-4 font-medium text-slate-900">
                {item.orgao}
              </td>
              <td className="px-6 py-4 font-mono">
                <div className="flex items-center gap-2">
                    <span className="text-indigo-600">{item.cnpj}</span>
                    <CopyButton textToCopy={item.cnpj} />
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                 <button onClick={() => onDetails(item.orgao, item.orgao.split(' de ').slice(1).join(' de '))} className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs py-1 px-3 rounded-md border border-indigo-200 hover:bg-indigo-50 transition-all">
                    Ver Detalhes
                 </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CnpjTable;
