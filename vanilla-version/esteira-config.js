// Configuração da esteira/funil de vendas para uso em vanilla JS
// Estrutura equivalente ao ESTEIRA_CONFIG do React

const ESTEIRA_CONFIG = [
  {
    id: 'Prospecção',
    label: 'Prospecção',
    color: 'blue',
    actions: [
      'Primeiro contato',
      'Apresentação do projeto (e-mail)',
      'Apresentação por vídeo/ligação',
      'Registro e alimentação de sistema'
    ]
  },
  {
    id: 'Apresentação',
    label: 'Apresentação / Qualificação',
    color: 'cyan',
    actions: [
      'Mostrar materiais e vantagens',
      'Coletar informações da outra parte',
      'Entender necessidades'
    ]
  },
  {
    id: 'Negociação',
    label: 'Negociação',
    color: 'yellow',
    actions: [
      'Conversas de fechamento',
      'Envio de propostas',
      'Análise e consideração de valores',
      'Acompanhamento da decisão'
    ]
  },
  {
    id: 'Fechamento',
    label: 'Fechamento',
    color: 'green',
    actions: [
      'Alinhamento final',
      'Ajustes de contrato',
      'Envio de documentos'
    ]
  },
  {
    id: 'Pós-venda',
    label: 'Pós-venda / Onboarding',
    color: 'purple',
    actions: [
      'Apresentação de relatórios',
      'Acompanhamento dos resultados',
      'Treinamento',
      'Suporte'
    ]
  },
  {
    id: 'Renovação',
    label: 'Renovação',
    color: 'orange',
    actions: [
      'Avaliação de performance',
      'Propostas de continuidade',
      'Reengajamento',
      'Reinício da prospecção'
    ]
  }
];

// Exporta para uso global
window.ESTEIRA_CONFIG = ESTEIRA_CONFIG;
