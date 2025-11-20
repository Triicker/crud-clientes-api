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
  observacoes?: string;
}

export interface SugestaoAbordagem {
  frases: string[];
  contexto: string;
}
