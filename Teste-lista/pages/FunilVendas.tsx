import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { KanbanColumn } from '../components/KanbanColumn';
import { ClientDetailsModal } from '../components/ClientDetailsModal';
import { Cliente, Interacao } from '../types';

const COLUMNS = ['Prospecção', 'Contato Inicial', 'Proposta', 'Negociação', 'Fechamento'];

export const FunilVendas: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [filterVendedor, setFilterVendedor] = useState('');
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes');
      if (response.ok) {
        const data = await response.json();
        // Ensure status is valid, default to 'Prospecção' if missing
        const validatedData = data.map((c: any) => ({
          ...c,
          status: COLUMNS.includes(c.status) ? c.status : 'Prospecção'
        }));
        setClientes(validatedData);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const clienteId = active.id as string;
    const newStatus = over.id as string;

    const cliente = clientes.find(c => c.id.toString() === clienteId);
    if (!cliente || cliente.status === newStatus) return;

    // Optimistic update
    setClientes(clientes.map(c => 
      c.id.toString() === clienteId ? { ...c, status: newStatus as any } : c
    ));

    try {
      await fetch(`/api/clientes/${clienteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cliente, status: newStatus }),
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      fetchClientes(); // Revert on error
    }
  };

  const handleSaveInteraction = async (interacao: Omit<Interacao, 'id' | 'data_interacao'>) => {
    try {
      await fetch('/api/interacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interacao),
      });
    } catch (error) {
      console.error('Erro ao salvar interação:', error);
    }
  };

  const filteredClientes = filterVendedor
    ? clientes.filter(c => c.vendedor_responsavel?.toLowerCase().includes(filterVendedor.toLowerCase()))
    : clientes;

  if (loading) return <div className="p-8 text-center">Carregando funil...</div>;

  return (
    <div className="h-screen flex flex-col bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Funil de Vendas</h1>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Filtrar por vendedor..."
            className="border rounded px-3 py-2"
            value={filterVendedor}
            onChange={(e) => setFilterVendedor(e.target.value)}
          />
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col}
              id={col}
              title={col}
              clientes={filteredClientes.filter(c => c.status === col)}
              onCardClick={setSelectedClient}
            />
          ))}
        </div>
      </DndContext>

      {selectedClient && (
        <ClientDetailsModal
          cliente={selectedClient}
          onClose={() => setSelectedClient(null)}
          onSaveInteraction={handleSaveInteraction}
        />
      )}
    </div>
  );
};
