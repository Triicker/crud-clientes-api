import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Cliente } from '../types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  clientes: Cliente[];
  onCardClick: (cliente: Cliente) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, clientes, onCardClick }) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className="flex-1 min-w-[250px] bg-gray-100 rounded-lg p-4 mr-4 flex flex-col h-full">
      <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
        {title}
        <span className="bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded-full">
          {clientes.length}
        </span>
      </h3>
      <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[100px]">
        {clientes.map((cliente) => (
          <KanbanCard key={cliente.id} cliente={cliente} onClick={onCardClick} />
        ))}
      </div>
    </div>
  );
};
