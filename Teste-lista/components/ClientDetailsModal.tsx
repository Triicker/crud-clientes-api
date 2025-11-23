import React, { useState, useEffect } from 'react';
import { Cliente, Interacao } from '../types';

interface ClientDetailsModalProps {
  cliente: Cliente | null;
  onClose: () => void;
  onSaveInteraction: (interacao: Omit<Interacao, 'id' | 'data_interacao'>) => Promise<void>;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ cliente, onClose, onSaveInteraction }) => {
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [novaInteracao, setNovaInteracao] = useState({ tipo: 'Nota', descricao: '', usuario_responsavel: 'Vendedor Atual' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cliente) {
      fetchInteracoes();
    }
  }, [cliente]);

  const fetchInteracoes = async () => {
    if (!cliente) return;
    try {
      const response = await fetch(`/api/interacoes/cliente/${cliente.id}`);
      if (response.ok) {
        const data = await response.json();
        setInteracoes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar interações:', error);
    }
  };

  const handleSave = async () => {
    if (!cliente) return;
    setLoading(true);
    await onSaveInteraction({ ...novaInteracao, cliente_id: cliente.id } as any);
    setNovaInteracao({ ...novaInteracao, descricao: '' });
    fetchInteracoes();
    setLoading(false);
  };

  if (!cliente) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
      <div className="bg-white w-full max-w-md h-full p-6 overflow-y-auto shadow-xl transform transition-transform">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{cliente.nome}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Detalhes</h3>
          <p><strong>CNPJ:</strong> {cliente.cnpj}</p>
          <p><strong>Cidade/UF:</strong> {cliente.cidade}/{cliente.uf}</p>
          <p><strong>Telefone:</strong> {cliente.telefone}</p>
          <p><strong>Status:</strong> <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{cliente.status}</span></p>
          <p><strong>Responsável:</strong> {cliente.vendedor_responsavel || 'Não atribuído'}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Nova Interação</h3>
          <div className="space-y-3">
            <select
              className="w-full border rounded p-2"
              value={novaInteracao.tipo}
              onChange={(e) => setNovaInteracao({ ...novaInteracao, tipo: e.target.value })}
            >
              <option value="Nota">Nota</option>
              <option value="Email">Email</option>
              <option value="Ligação">Ligação</option>
              <option value="Reunião">Reunião</option>
            </select>
            <textarea
              className="w-full border rounded p-2 h-24"
              placeholder="Descreva a interação..."
              value={novaInteracao.descricao}
              onChange={(e) => setNovaInteracao({ ...novaInteracao, descricao: e.target.value })}
            />
            <button
              onClick={handleSave}
              disabled={loading || !novaInteracao.descricao}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Adicionar Interação'}
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Histórico</h3>
          <div className="space-y-4">
            {interacoes.map((interacao) => (
              <div key={interacao.id} className="border-l-2 border-gray-300 pl-4 py-1">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm text-gray-700">{interacao.tipo}</span>
                  <span className="text-xs text-gray-400">{new Date(interacao.data_interacao).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{interacao.descricao}</p>
                <p className="text-xs text-gray-400 mt-1">Por: {interacao.usuario_responsavel}</p>
              </div>
            ))}
            {interacoes.length === 0 && <p className="text-gray-400 text-sm italic">Nenhuma interação registrada.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
