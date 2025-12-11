export interface CnpjResult {
  orgao: string;
  cnpj: string;
}

export interface ContatoChave {
  nome: string;
  cargo: string;
}

export interface OrgaoResult {
  orgao: string;
  cnpj: string;
  localidade: string;
  potencialCompra: 'Alto' | 'Médio' | 'Baixo';
  contatosChave: ContatoChave[];
  iniciativasRecentes: string;
  fonteInformacao?: string;
}

export interface LeadResult {
  entidade: string;
  cnpj?: string;
  tipo: string;
  localidade: string;
  contatoNome?: string;
  contatoCargo?: string;
  contatoPublico?: string;
  endereco?: string;
  website?: string;
  email?: string;
  corpoDocente?: string;
  observacoes?: string;
}

export interface SugestaoAbordagem {
  frases: string[];
  contexto: string;
}

export interface Cliente {
  id: number;
  nome: string;
  tipo: string;
  cnpj: string;
  cidade: string;
  uf: string;
  telefone: string;
  observacoes: string;
  status: 'Prospecção' | 'Contato Inicial' | 'Proposta' | 'Negociação' | 'Fechamento';
  vendedor_responsavel?: string;
}

export interface Interacao {
  id: number;
  cliente_id: number;
  tipo: 'Nota' | 'Email' | 'Ligação' | 'Reunião';
  descricao: string;
  data_interacao: string;
  usuario_responsavel: string;
}
