import { GoogleGenAI, Type } from "@google/genai";
import type { CnpjResult, LeadResult } from '../types';
import { db } from './firebaseConfig';
import { doc, getDoc, setDoc } from "firebase/firestore";

// Mapeamento de UF para nome do estado para melhorar a precisão do prompt
const estadosBrasil: { [key: string]: string } = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia', 'CE': 'Ceará',
  'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
  'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo',
  'SE': 'Sergipe', 'TO': 'Tocantins'
};

const generateCacheKey = (...args: string[]) => {
  return args.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
};

// Função auxiliar para tentar múltiplos modelos e retentativas
async function generateWithRetry(ai: GoogleGenAI, prompt: string, schema?: any) {
  // Lista de modelos ESTÁVEIS. Evite versões experimentais (-exp) em produção.
  // 'gemini-1.5-flash' é o mais rápido e barato. 'gemini-1.5-pro' é mais inteligente.
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash", "gemini-2.0-flash-exp"];
  
  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const config: any = {};
        if (schema) {
            config.responseMimeType = "application/json";
            config.responseSchema = schema;
        }

        console.log(`Tentando modelo ${model} (Tentativa ${attempt})...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: config,
        });
        return response;
      } catch (error: any) {
        const isOverloaded = error.message?.includes('503') || error.message?.includes('overloaded');
        const isQuotaExceeded = error.message?.includes('429');
        const isNotFound = error.message?.includes('404') || error.message?.includes('not found');

        if (isQuotaExceeded) {
             console.warn(`Cota excedida para o modelo ${model} (429). Tentando próximo modelo...`);
             break; // Se acabou a cota deste modelo, não adianta tentar de novo. Vai para o próximo.
        } else if (isNotFound) {
             console.warn(`Modelo ${model} não encontrado (404). Tentando próximo modelo...`);
             break; 
        } else if (isOverloaded) {
          if (attempt < 3) {
            const delay = 3000 * attempt; 
            console.warn(`Modelo ${model} sobrecarregado (503). Aguardando ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            console.warn(`Modelo ${model} falhou após 3 tentativas. Tentando próximo modelo...`);
            break; 
          }
        }
        
        throw error; 
      }
    }
  }
  throw new Error("Falha na API Gemini. Possíveis causas: Cota excedida (429) ou instabilidade nos servidores (503). Verifique o console para detalhes.");
}


const CACHE_VERSION = 'v2'; // Versão do cache - incrementar quando mudar estrutura de dados

export async function fetchCnpjs(apiKey: string, estado: string, tipoOrgao: string): Promise<LeadResult[]> {
  const cacheKey = generateCacheKey('cnpj', CACHE_VERSION, estado, tipoOrgao);
  const docRef = doc(db, "cnpj_searches", cacheKey);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const cachedData = docSnap.data();
      // Verificar se o cache tem a estrutura nova (com potencialCompra)
      if (cachedData.result && cachedData.result[0] && 'entidade' in cachedData.result[0]) {
        console.log("✅ Dados enriquecidos recuperados do Cache (Firebase)!");
        return cachedData.result as LeadResult[];
      } else {
        console.log("⚠️ Cache antigo detectado. Buscando novos dados...");
      }
    }
  } catch (error) {
    console.warn("Erro ao ler cache do Firebase:", error);
  }

  const ai = new GoogleGenAI({ apiKey });
  const nomeEstado = estadosBrasil[estado] || estado;

  const prompt = `
    Você é um analista de inteligência de mercado especializado no setor educacional público brasileiro.
    
    SUA MISSÃO:
    Encontrar escolas, secretarias de educação ou prefeituras no estado de ${nomeEstado} (${estado}) que correspondam ao termo "${tipoOrgao}".
    
    REGRAS ESTRITAS DE PESQUISA E CNPJ (CRÍTICO):
    1. **HIERARQUIA DE CNPJ**:
       - Escolas Públicas muitas vezes não têm CNPJ próprio.
       - **OBRIGATÓRIO**: Se não encontrar CNPJ da escola, busque pelo CNPJ da **"Caixa Escolar"**, **"Conselho Escolar"** ou **"Associação de Pais e Mestres (APM)"** vinculada à escola.
       - Esses CNPJs são VÁLIDOS para prospecção e devem ser retornados no campo 'cnpj'.
       - Se usar um desses, adicione nas observações: "CNPJ da Caixa Escolar/APM".
    2. **VALIDAÇÃO**: Apenas retorne resultados que tenham um CNPJ preenchido (seja da escola ou da entidade mantenedora).
    3. **DADOS DE CONTATO**: Priorize entidades com telefone (fixo ou celular), e-mail e site oficial.
    3. **CORPO DOCENTE**: Pesquise ativamente por nomes de diretores, coordenadores, secretários ou professores. Tente encontrar seus e-mails ou telefones corporativos.
    4. **LOCALIZAÇÃO**: Certifique-se de que a entidade é realmente do estado de ${nomeEstado}.
    5. **ATUALIZAÇÃO**: Busque os dados mais recentes disponíveis (2024/2025).

    FORMATO DE RESPOSTA (JSON):
    Retorne um array de objetos com a seguinte estrutura exata:
    [
      {
        "entidade": "Nome Oficial da Escola ou Secretaria",
        "cnpj": "00.000.000/0000-00",
        "tipo": "Escola" | "Secretaria" | "Prefeitura",
        "localidade": "Cidade - UF",
        "contatoPublico": "(XX) XXXX-XXXX",
        "contatoNome": "Nome do Diretor/Responsável (se houver)",
        "contatoCargo": "Cargo do Responsável",
        "email": "email@dominio.gov.br",
        "website": "www.site.gov.br",
        "endereco": "Rua X, Bairro Y, CEP 00000-000",
        "corpoDocente": "Diretor: João Silva (joao@email.com); Coordenadora: Maria (11 9999-9999)...",
        "observacoes": "Detalhes relevantes sobre a escola, número de alunos, IDEB, etc."
      }
    ]

    IMPORTANTE:
    - O campo "corpoDocente" deve ser uma string única formatada com ponto e vírgula separando os membros (ex: "Diretor: Nome; Coord: Nome").
    - **CRÍTICO**: Se não encontrar NOMES ESPECÍFICOS de pessoas, deixe o campo "corpoDocente" VAZIO. NÃO coloque descrições genéricas como "Equipe qualificada" ou "Corpo docente completo".
    - Se não encontrar CNPJ, pule a entidade.
    - Tente trazer pelo menos 10 resultados relevantes.
  `;

  try {
    const response = await generateWithRetry(ai, prompt, {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              orgao: {
                type: Type.STRING,
                description: `O nome completo do órgão público`,
              },
              cnpj: {
                type: Type.STRING,
                description: "O número do CNPJ formatado como 'XX.XXX.XXX/XXXX-XX'",
              },
              localidade: {
                type: Type.STRING,
                description: "Cidade e estado (ex: 'Salvador, BA')",
              },
              potencialCompra: {
                type: Type.STRING,
                description: "Classificação: 'Alto', 'Médio' ou 'Baixo'",
                enum: ["Alto", "Médio", "Baixo"],
              },
              contatosChave: {
                type: Type.ARRAY,
                description: "Lista de decisores principais",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nome: {
                      type: Type.STRING,
                      description: "Nome completo do contato",
                    },
                    cargo: {
                      type: Type.STRING,
                      description: "Cargo do contato",
                    },
                  },
                  required: ["nome", "cargo"],
                },
              },
              iniciativasRecentes: {
                type: Type.STRING,
                description: "Resumo de projetos ou licitações recentes (máx 200 chars)",
              },
              fonteInformacao: {
                type: Type.STRING,
                description: "URL da fonte principal dos dados",
              },
            },
            required: ["orgao", "cnpj", "localidade", "potencialCompra", "contatosChave", "iniciativasRecentes"],
          },
        });

    if (!response.text) {
        throw new Error("A resposta da API estava vazia.");
    }

    const cleanedJsonString = response.text.trim();
    const data = JSON.parse(cleanedJsonString);
    
    if (!Array.isArray(data)) {
        throw new Error("O formato da resposta da API não é um array JSON válido.");
    }
    
    const isValidData = data.every(item => 
        typeof item === 'object' && item !== null && 'entidade' in item && 'cnpj' in item
    );

    if (!isValidData) {
        throw new Error("Alguns itens na resposta da API não correspondem ao formato esperado.");
    }

    // Salvar no cache com versão
    try {
      await setDoc(docRef, {
        result: data,
        createdAt: new Date().toISOString(),
        cacheVersion: CACHE_VERSION,
        estado,
        tipoOrgao
      });
      console.log("💾 Cache atualizado com novos dados enriquecidos!");
    } catch (error) {
      console.warn("Erro ao salvar no cache do Firebase:", error);
    }

    return data as LeadResult[];

  } catch (error) {
    console.error("Erro ao chamar a API Gemini:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error("A chave de API fornecida não é válida.");
    }
    throw new Error("Não foi possível gerar a lista de CNPJs.");
  }
}

export async function fetchLeads(apiKey: string, estado: string, cidade: string, tipoEntidade: string): Promise<LeadResult[]> {
  const cacheKey = generateCacheKey('leads', CACHE_VERSION, estado, cidade, tipoEntidade);
  const docRef = doc(db, "leads_searches", cacheKey);

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("✅ Dados recuperados do Cache (Firebase)!");
      return docSnap.data().result as LeadResult[];
    }
  } catch (error) {
    console.warn("Erro ao ler cache do Firebase:", error);
  }

  const ai = new GoogleGenAI({ apiKey });
  const nomeEstado = estadosBrasil[estado] || estado;

  const prompt = `
    Gere uma lista detalhada de contatos (leads) para prospecção de serviços educacionais, com foco em "${tipoEntidade}" na cidade de "${cidade}", estado de ${nomeEstado}.
    
    IMPORTANTE: Inclua informações sobre CORPO DOCENTE e GESTÃO ESCOLAR sempre que possível.
    
    Para cada lead encontrado, forneça as seguintes informações em formato JSON:
    1.  'entidade': O nome completo da instituição (ex: 'Colégio Anchieta', 'Secretaria Municipal de Educação de ${cidade}').
    2.  'cnpj': O CNPJ da instituição, se for publicamente disponível. Formate como 'XX.XXX.XXX/XXXX-XX'. Se não encontrar, retorne null.
    3.  'tipo': O tipo de entidade (ex: 'Escola Privada', 'Prefeitura').
    4.  'localidade': A cidade e o estado (ex: '${cidade}, ${estado}').
    5.  'contatoNome': O nome de um contato decisor relevante (ex: Diretor(a), Secretário(a) de Educação, Coordenador(a) Pedagógico). Se não encontrar, retorne null.
    6.  'contatoCargo': O cargo do contato mencionado. Se não encontrar, retorne null.
    7.  'contatoPublico': O telefone de contato PÚBLICO e GERAL da instituição. Importante: NÃO forneça telefones pessoais/diretos de indivíduos. Se não encontrar, retorne null.
    8.  'endereco': O endereço completo da instituição (Rua, Número, Bairro, CEP). Se não encontrar, retorne null.
    9.  'website': O website oficial da instituição. Se não encontrar, retorne null.
    10. 'email': O e-mail de contato PÚBLICO e GERAL da instituição (ex: contato@escola.com.br). NÃO forneça e-mails pessoais. Se não encontrar, retorne null.
    11. 'corpoDocente': Liste APENAS nomes e cargos específicos de membros do corpo docente (ex: "Diretor: João Silva; Coord: Maria"). Se não encontrar nomes específicos, retorne null. NÃO inclua descrições genéricas como "Atende Educação Infantil" ou "Equipe qualificada".
    12. 'observacoes': Uma breve observação sobre a instituição (ex: "Escola tradicional com foco em esportes", "Rede com 3 unidades", "Reconhecida pelo MEC").
    
    Priorize escolas com informações mais completas sobre gestão e corpo docente. Gere uma lista com até 60 resultados.
  `;

  try {
    const response = await generateWithRetry(ai, prompt, {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              entidade: { type: Type.STRING },
              cnpj: { type: Type.STRING, nullable: true },
              tipo: { type: Type.STRING },
              localidade: { type: Type.STRING },
              contatoNome: { type: Type.STRING, nullable: true },
              contatoCargo: { type: Type.STRING, nullable: true },
              contatoPublico: { type: Type.STRING, nullable: true },
              endereco: { type: Type.STRING, nullable: true },
              website: { type: Type.STRING, nullable: true },
              email: { type: Type.STRING, nullable: true },
              corpoDocente: { type: Type.STRING, nullable: true },
              observacoes: { type: Type.STRING, nullable: true },
            },
            required: ["entidade", "tipo", "localidade"],
          },
        });

    if (!response.text) {
      throw new Error("A resposta da API estava vazia.");
    }

    const data = JSON.parse(response.text.trim());

    if (!Array.isArray(data)) {
        throw new Error("O formato da resposta da API não é um array JSON válido.");
    }

    // Salvar no cache com versão
    try {
      await setDoc(docRef, {
        result: data,
        createdAt: new Date().toISOString(),
        cacheVersion: CACHE_VERSION,
        estado,
        cidade,
        tipoEntidade
      });
    } catch (error) {
      console.warn("Erro ao salvar no cache do Firebase:", error);
    }

    return data as LeadResult[];

  } catch (error) {
    console.error("Erro ao chamar a API Gemini para buscar leads:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error("A chave de API fornecida não é válida.");
    }
    throw new Error("Não foi possível gerar a lista de contatos.");
  }
}

export async function fetchDetails(apiKey: string, entityName: string, location: string): Promise<string> {
    const cacheKey = generateCacheKey('details', entityName, location);
    const docRef = doc(db, "details_searches", cacheKey);

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log("✅ Dados recuperados do Cache (Firebase)!");
        return docSnap.data().result as string;
      }
    } catch (error) {
      console.warn("Erro ao ler cache do Firebase:", error);
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Forneça um resumo detalhado e informativo sobre a entidade "${entityName}", localizada em "${location}".
      O resumo deve ser útil para uma prospecção de negócios e incluir, se possível:
      - **Missão e Foco:** Qual o principal objetivo ou área de atuação da entidade?
      - **Principais Gestores:** Liste os nomes e cargos dos principais gestores ou decisores (ex: Prefeito, Secretário de Educação, Diretor Geral).
      - **Projetos ou Iniciativas Recentes:** Mencione quaisquer projetos, programas ou notícias relevantes recentes associados à entidade.
      - **Tamanho e Relevância:** Forneça uma noção do porte da entidade (ex: número de alunos, população da cidade, orçamento, etc.).

      Formate a resposta de forma clara e organizada, usando títulos para cada seção. Não use formatação JSON.
    `;

    try {
        const response = await generateWithRetry(ai, prompt);

        if (!response.text) {
            throw new Error("A resposta da API estava vazia.");
        }

        // Salvar no cache
        try {
          await setDoc(docRef, {
            result: response.text,
            createdAt: new Date().toISOString(),
            entityName,
            location
          });
        } catch (error) {
          console.warn("Erro ao salvar no cache do Firebase:", error);
        }

        return response.text;
    } catch (error) {
        console.error("Erro ao buscar detalhes com a API Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error("A chave de API fornecida não é válida.");
        }
        throw new Error(`Não foi possível obter detalhes para "${entityName}".`);
    }
}

/**
 * Gera sugestões de abordagem de vendas personalizadas usando IA
 * A IA age como consultor de vendas sênior analisando iniciativas recentes
 */
export async function generateSalesApproach(
    orgao: string,
    iniciativasRecentes: string,
    apiKey: string
): Promise<{ frases: string[], contexto: string }> {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Você é um consultor de vendas sênior especializado em educação e tecnologia educacional.

CONTEXTO:
- Órgão Público: ${orgao}
- Iniciativas Recentes: ${iniciativasRecentes}

MISSÃO:
Sua empresa oferece soluções de tecnologia educacional, plataformas digitais de aprendizagem, capacitação de professores e transformação digital para instituições de ensino.

Analise as iniciativas recentes deste órgão e crie de 2 a 3 frases de "gancho de vendas" altamente personalizadas e eficazes que um vendedor pode usar como abertura em um e-mail ou ligação.

REGRAS CRÍTICAS:
1. Cada frase deve conectar uma iniciativa específica do órgão com uma solução que sua empresa oferece
2. Use tom consultivo, não agressivo - mostre que você entende os desafios deles
3. Seja específico - mencione programas, projetos ou desafios que você identificou
4. Frases devem ter entre 20-40 palavras
5. Foque em VALOR e RESULTADOS, não em características do produto
6. Use dados ou tendências do mercado educacional quando relevante

FORMATO DE RESPOSTA:
Retorne um JSON com:
- "frases": array com 2-3 sugestões de abordagem
- "contexto": breve análise (1-2 linhas) do cenário do órgão que justifica essas abordagens

Exemplo do formato esperado:
{
  "frases": [
    "Vi que vocês lançaram o programa 'Escola Digital'. Temos ajudado secretarias como a de vocês a aumentar em 40% o engajamento dos alunos com plataformas adaptativas. Podemos agendar 15 minutos?",
    "Notei a iniciativa de capacitação de professores para metodologias ativas. Nossa solução já treinou mais de 5.000 educadores no Nordeste com resultados comprovados. Vale uma conversa?"
  ],
  "contexto": "Órgão em fase de transformação digital com foco em capacitação docente e engajamento estudantil."
}`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            frases: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array com 2-3 frases de abordagem de vendas personalizadas"
            },
            contexto: {
                type: Type.STRING,
                description: "Breve análise do cenário do órgão (1-2 linhas)"
            }
        },
        required: ["frases", "contexto"]
    };

    try {
        console.log(`🎯 Gerando sugestões de abordagem para: ${orgao}`);
        const response = await generateWithRetry(ai, prompt, schema);
        
        if (!response.text) {
            throw new Error("A resposta do modelo estava vazia");
        }

        const result = JSON.parse(response.text);
        
        console.log(`✅ ${result.frases.length} sugestões geradas com sucesso`);
        return result;
    } catch (error) {
        console.error("Erro ao gerar sugestões de abordagem:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error("A chave de API fornecida não é válida.");
        }
        throw new Error(`Não foi possível gerar sugestões de abordagem para "${orgao}".`);
    }
}
