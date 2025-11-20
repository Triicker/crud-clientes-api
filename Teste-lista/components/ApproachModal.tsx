import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ApproachModalProps {
  isOpen: boolean;
  orgao: string;
  isLoading: boolean;
  sugestoes: string[] | null;
  contexto: string | null;
  error: string | null;
  onClose: () => void;
}

const ApproachModal: React.FC<ApproachModalProps> = ({
  isOpen,
  orgao,
  isLoading,
  sugestoes,
  contexto,
  error,
  onClose,
}) => {
  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">💡 Sugestões de Abordagem</h2>
            <p className="text-green-50 text-sm mt-1">{orgao}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-green-100 transition-colors p-2 hover:bg-green-700 rounded-full"
            aria-label="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner />
              <p className="text-slate-600 mt-4 text-center">
                🧠 Analisando iniciativas e gerando sugestões personalizadas...
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Isso pode levar alguns segundos
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-red-800 font-semibold">Erro ao gerar sugestões</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && sugestoes && sugestoes.length > 0 && (
            <div className="space-y-6">
              {/* Contexto */}
              {contexto && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h3 className="text-blue-900 font-semibold text-sm mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Análise do Cenário
                  </h3>
                  <p className="text-blue-800 text-sm">{contexto}</p>
                </div>
              )}

              {/* Sugestões */}
              <div>
                <h3 className="text-slate-700 font-semibold mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Frases para usar em e-mail ou ligação:
                </h3>
                
                <div className="space-y-4">
                  {sugestoes.map((frase, index) => (
                    <div
                      key={index}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Sugestão {index + 1}
                            </span>
                          </div>
                          <p className="text-slate-800 leading-relaxed">{frase}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(frase)}
                          className="flex-shrink-0 p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Copiar para área de transferência"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dicas */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-yellow-900 font-semibold text-sm mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Dicas de uso
                </h4>
                <ul className="text-yellow-800 text-sm space-y-1 ml-7">
                  <li>• Personalize ainda mais adicionando seu nome e empresa</li>
                  <li>• Use como abertura e complemente com sua proposta de valor</li>
                  <li>• Teste diferentes abordagens com diferentes contatos</li>
                  <li>• Agende follow-up em 2-3 dias caso não tenha resposta</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApproachModal;
