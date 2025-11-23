import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Cliente } from '../types';

interface KanbanCardProps {
  cliente: Cliente;
  onClick: (cliente: Cliente) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ cliente, onClick }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: cliente.id.toString(),
    data: { cliente },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white p-3 mb-2 rounded shadow-sm cursor-pointer hover:shadow-md border-l-4 border-blue-500"
      onClick={() => onClick(cliente)}
    >
      <h4 className="font-bold text-sm text-gray-800">{cliente.nome}</h4>
      <p className="text-xs text-gray-500 truncate">{cliente.cidade} - {cliente.uf}</p>
      {cliente.vendedor_responsavel && (
        <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded mt-1 inline-block">
          {cliente.vendedor_responsavel}
        </span>
      )}
    </div>
  );
};
