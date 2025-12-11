-- Migration para estrutura de tarefas da esteira
-- Esta migration garante que a coluna tarefas_concluidas está no formato correto

-- 1. Garantir que a coluna tarefas_concluidas existe
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tarefas_concluidas JSONB DEFAULT '{}'::jsonb;

-- 2. Atualizar qualquer valor NULL para objeto vazio
UPDATE clientes SET tarefas_concluidas = '{}'::jsonb WHERE tarefas_concluidas IS NULL;

-- 3. Comentários sobre a estrutura esperada de tarefas_concluidas
-- Formato: 
-- {
--   "prospeccao": [0, 1, 2],  // índices das ações concluídas (0-4)
--   "aumentar_conexao": [0],
--   "envio_consultor": [],
--   ... (uma chave para cada etapa da esteira)
-- }

-- 4. Status válidos conforme a nova estrutura da esteira
-- Os status devem corresponder às etapas principais:
-- - Prospecção (engloba: prospeccao, aumentar_conexao)
-- - Apresentação (engloba: envio_consultor)
-- - Negociação (engloba: efetivacao)
-- - Fechamento (engloba: registros_legais, separacao, entrega)
-- - Pós-venda (engloba: recebimentos, formacao, documentarios, gerar_graficos)
-- - Renovação (engloba: renovacao)

-- 5. Verificação de integridade (opcional - para debug)
-- SELECT id, nome, status, tarefas_concluidas 
-- FROM clientes 
-- WHERE tarefas_concluidas IS NOT NULL 
-- LIMIT 10;
