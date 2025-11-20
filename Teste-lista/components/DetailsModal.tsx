import React, { useState, useEffect } from 'react';
import { fetchDetails } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  entityName: string;
  location: string;
}

const DetailsModal: React.FC<DetailsModalProps> = ({ isOpen, onClose, apiKey, entityName, location }) => {
  const [details, setDetails] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadDetails = async () => {
        setIsLoading(true);
        setError(null);
        setDetails('');
        try {
          const result = await fetchDetails(apiKey, entityName, location);
          setDetails(result);
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Ocorreu um erro desconhecido ao buscar os detalhes.');
          }
        } finally {
          setIsLoading(false);
        }
      };
      loadDetails();
    }
  }, [isOpen, apiKey, entityName, location]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-5 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
          <h2 id="modal-title" className="text-xl font-bold text-slate-800">Detalhes de: {entityName}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Fechar modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="p-6 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-slate-600">Buscando informações detalhadas...</p>
            </div>
          )}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
              <p className="font-bold">Erro ao carregar</p>
              <p>{error}</p>
            </div>
          )}
          {details && !isLoading && (
             <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: details.replace(/\n/g, '<br />') }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;
