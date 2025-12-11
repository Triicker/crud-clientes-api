# Implementação da Esteira de Trabalho

Este documento resume a implementação da nova Esteira de Trabalho baseada no fluxo descrito.

## 1. Configuração da Esteira (`Teste-lista/esteiraConfig.ts`)

A esteira foi configurada com as seguintes etapas e ações:

1.  **Prospecção** (Azul)
    *   Pesquisa de dados básicos
    *   Identificação de decisores
    *   Primeiro contato (Email/Tel)
2.  **Apresentação** (Roxo)
    *   Agendamento de reunião
    *   Envio de material institucional
    *   Realização da apresentação
3.  **Negociação** (Amarelo)
    *   Envio de proposta comercial
    *   Follow-up da proposta
    *   Ajustes e contrapropostas
4.  **Fechamento** (Verde)
    *   Coleta de documentos
    *   Assinatura do contrato
    *   Pagamento inicial
5.  **Pós-venda** (Indigo)
    *   Onboarding do cliente
    *   Treinamento da equipe
    *   Pesquisa de satisfação
6.  **Renovação** (Rosa)
    *   Contato para renovação
    *   Revisão de contrato
    *   Envio de nova proposta

## 2. Alterações no Banco de Dados (`MIGRATION_ESTEIRA.sql`)

Foi criado um script de migração para:
*   Adicionar a coluna `tarefas_concluidas` (JSONB) na tabela `clientes`.
*   Atualizar os status antigos para os novos IDs da esteira.

**IMPORTANTE:** Você precisa rodar este script no seu banco de dados PostgreSQL para que a nova funcionalidade funcione corretamente.

## 3. Alterações no Backend

*   **Controller (`clientesController.js`)**: Atualizado para receber e salvar o campo `tarefas_concluidas` nas operações de criação e atualização de clientes.

## 4. Alterações no Frontend

*   **Funil de Vendas (`FunilVendas.tsx`)**:
    *   Agora gera as colunas dinamicamente baseadas na configuração da esteira.
    *   Valida e corrige status de clientes que não estejam na configuração atual.
*   **Card do Cliente (`KanbanCard.tsx`)**:
    *   A borda lateral agora reflete a cor da etapa atual do cliente.
*   **Modal de Detalhes (`ClientDetailsModal.tsx`)**:
    *   Exibe o checklist de ações correspondente à etapa atual do cliente.
    *   Permite marcar/desmarcar itens, salvando o progresso automaticamente.
    *   Mostra uma barra de progresso visual (contagem de itens concluídos).

## Como Usar

1.  Execute o script SQL no seu banco de dados.
2.  Reinicie o servidor backend (`node server.js`).
3.  Inicie o frontend (`npm run dev` na pasta `Teste-lista`).
4.  Acesse o menu "Funil de Vendas".
5.  Arraste os cards entre as colunas para mudar de etapa.
6.  Clique em um card para abrir os detalhes e interagir com o checklist da etapa.
