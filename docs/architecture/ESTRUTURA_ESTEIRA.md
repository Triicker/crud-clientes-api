# Estrutura da Esteira de Processos - Documentação Completa

## Visão Geral

A esteira de processos é uma matriz de tarefas organizadas por etapas do funil de vendas e pós-venda. Cada cliente tem seu próprio progresso salvo no banco de dados.

## Estrutura de Dados

### Campo: `tarefas_concluidas` (JSONB)

Armazenado na tabela `clientes`, formato:

```json
{
  "prospeccao": [0, 1],      // Ações 0 e 1 concluídas
  "aumentar_conexao": [0, 2],         // Ações 0 e 2 concluídas
  "envio_consultor": [],              // Nenhuma ação concluída
  "efetivacao": [0, 1, 2, 3],        // Todas as 4 ações concluídas
  "registros_legais": [],
  "separacao": [],
  "entrega": [],
  "recebimentos": [],
  "formacao": [],
  "documentarios": [],
  "gerar_graficos": [],
  "renovacao": []
}
```

## Etapas da Esteira

### 1. PROSPECÇÃO 3 CANAIS (prospeccao)
- **Tipo**: PROSPECÇÃO
- **Cor**: Amarelo (#ffff00)
- **Ações**:
  0. Apresentar projeto - email
  1. Apresentação projeto - video Watsapp
  2. Apresentação projeto por ligação
  3. (vazio)
  4. alimenta sistema

### 2. AUMENTAR CONEXÃO (aumentar_conexao)
- **Tipo**: PROSPECÇÃO
- **Cor**: Amarelo (#ffff00)
- **Ações**:
  0. responde contatos c/ link video anexado
  1. liga e agenda reunião consultor
  2. Relembra reunião e envio video anexado
  3. (vazio)
  4. alimenta sistema

### 3. ENVIO DE CONSULTOR (envio_consultor)
- **Tipo**: REPRESENTANTE OU DISTRIB
- **Cor**: Laranja (#ff9966)
- **Ações**:
  0. Apresentação técnica c/material
  1. Coleta de parecer
  2. atualiza números alunos/email
  3. negocia fornecimento/data/prod.
  4. Alimentar sistema

### 4. EFETIVAÇÃO (efetivacao)
- **Tipo**: DIRETOR
- **Cor**: Ciano (#00ccff)
- **Ações**:
  0. Envia proposta + document
  1. Acompanha publicação
  2. Emite NF
  3. (vazio)
  4. Alimentar sistema

### 5. REGISTROS LEGAIS (registros_legais)
- **Tipo**: DIRETOR
- **Cor**: Ciano (#00ccff)
- **Ações**:
  0. assina contrato
  1. registra publicação
  2. Emite NF
  3. (vazio)
  4. Alimentar sistema

### 6. SEPARAÇÃO (separacao)
- **Tipo**: LOGÍSTICA
- **Cor**: Cinza (#cccccc)
- **Ações**:
  0. separa material
  1. envia material
  2. informa envio (foto)
  3. (vazio)
  4. Alimentar sistema

### 7. ENTREGA (entrega)
- **Tipo**: LOGÍSTICA
- **Cor**: Cinza (#cccccc)
- **Ações**:
  0. Realiza entrega(Foto)
  1. documenta entrega(Foto)
  2. (vazio)
  3. (vazio)
  4. Alimentar sistema

### 8. RECEBIMENTOS (recebimentos)
- **Tipo**: FINANCEIRO
- **Cor**: Amarelo (#ffff00)
- **Ações**:
  0. Acompanha pagamento
  1. cobra pagamento
  2. baixa de titulo
  3. (vazio)
  4. Alimentar sistema

### 9. FORMAÇÃO (formacao)
- **Tipo**: FORMADORES
- **Cor**: Bege (#ffcc99)
- **Ações**:
  0. Agenda formação
  1. Realiza formação
  2. Entrega certificado
  3. (vazio)
  4. Alimentar sistema

### 10. DOCUMENTÁRIOS (documentarios)
- **Tipo**: MARKETING
- **Cor**: Verde claro (#99ff99)
- **Ações**:
  0. coleta imagens e entrevista
  1. gera video
  2. publica video
  3. cadastrar para premiações
  4. Alimentar sistema

### 11. GERAR GRÁFICOS (gerar_graficos)
- **Tipo**: TECNOGIA E GERENCIA DADOS
- **Cor**: Azul claro (#ccccff)
- **Ações**:
  0. Medir indices e validação
  1. pesquisas satisfação/DIVERSAS
  2. Criar e alimentar publicar relatórios
  3. (vazio)
  4. Alimentar sistema

### 12. RENOVAÇÃO DE RELACIONAMENTO (renovacao)
- **Tipo**: PROSPECÇÃO
- **Cor**: Amarelo (#ffff00)
- **Ações**:
  0. APRESENTAR RELATÓRIOS E CONQUISTAS
  1. ENVIAR CERTIFICADOS
  2. recomeçar propecção outra coleção
  3. (vazio)
  4. Alimentar sistema

## Como Funciona

### Frontend (vanilla-version/script.js)

1. **Renderização da Tabela**: `renderEsteiraProcessosTableInTableContainer()`
   - Cria uma tabela HTML com todas as etapas como colunas
   - Cada linha representa uma ação (AÇÃO 1, AÇÃO 2, etc.)
   - Células clicáveis mudam de cor quando marcadas

2. **Marcação de Tarefas**: Event listener em cada célula
   - Clique marca/desmarca a tarefa (verde = concluída)
   - Atualiza o objeto `selectedClient.tarefas_concluidas`
   - Chama `salvarTarefasCliente()` para persistir no backend

3. **Carregamento de Tarefas**: `openEsteiraModal()`
   - Busca as tarefas do cliente via API `/api/clientes/:id/esteira`
   - Preenche a tabela com as tarefas já concluídas

### Backend

#### Endpoints

1. **GET /api/clientes/:id/esteira**
   - Retorna: `{ status: string, tarefas_concluidas: object }`
   - Usado ao abrir a esteira para carregar o progresso do cliente

2. **PUT /api/clientes/:id/tarefas**
   - Body: `{ tarefas_concluidas: object }`
   - Atualiza as tarefas concluídas do cliente
   - Retorna o cliente atualizado

#### Controladores

- `controller/tarefasController.js`: Lógica de negócio
- `routes/tarefas.js`: Definição das rotas
- `config/db.js`: Conexão com PostgreSQL

## Fluxo de Uso

1. Usuário clica no botão "Esteira" de um cliente na tabela
2. Sistema carrega as tarefas já concluídas do banco de dados
3. Tabela é renderizada com células verdes para tarefas concluídas
4. Usuário clica em uma célula para marcar/desmarcar uma tarefa
5. Sistema salva imediatamente no banco de dados
6. Visual é atualizado em tempo real

## Benefícios

- ✅ **Organizado por Cliente**: Cada cliente tem seu próprio progresso
- ✅ **Persistência**: Dados salvos no banco de dados PostgreSQL
- ✅ **Visual Intuitivo**: Cores e layout similar ao Excel
- ✅ **Feedback Imediato**: Mudanças visuais instantâneas ao clicar
- ✅ **Escalável**: Fácil adicionar novas etapas ou ações

## Manutenção

Para adicionar novas etapas ou ações:

1. Edite a constante `etapas` em `renderEsteiraProcessosTableInTableContainer()`
2. Adicione as ações correspondentes no array `acoes`
3. Garanta que a migração SQL está aplicada
4. Reinicie o servidor se necessário

## Troubleshooting

### Tarefas não salvam
- Verifique se o token de autenticação está válido
- Confirme que o endpoint `/api/clientes/:id/tarefas` está acessível
- Veja logs do console do navegador e do servidor

### Tarefas não aparecem
- Verifique se a migração SQL foi executada
- Confirme que `tarefas_concluidas` não é NULL no banco
- Veja se o cliente tem o campo `tarefas_concluidas` preenchido

### Cores incorretas
- Verifique o mapeamento de cores por tipo de etapa
- Ajuste os valores hexadecimais no código se necessário
