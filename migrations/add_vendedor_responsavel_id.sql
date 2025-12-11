-- Migration: Adicionar coluna vendedor_responsavel_id na tabela clientes
-- Data: 2025-12-09
-- Descrição: Adiciona referência de chave estrangeira para a tabela usuarios

-- Adiciona a coluna vendedor_responsavel_id (INTEGER, pode ser NULL)
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS vendedor_responsavel_id INTEGER;

-- Adiciona constraint de chave estrangeira
ALTER TABLE clientes 
ADD CONSTRAINT fk_vendedor_responsavel 
FOREIGN KEY (vendedor_responsavel_id) 
REFERENCES usuarios(id) 
ON DELETE SET NULL;

-- Cria índice para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_clientes_vendedor_responsavel_id 
ON clientes(vendedor_responsavel_id);

-- Atualiza clientes existentes que já tem nome do vendedor mas não tem ID
-- (Tenta encontrar o ID baseado no nome)
UPDATE clientes c
SET vendedor_responsavel_id = u.id
FROM usuarios u
WHERE c.vendedor_responsavel = u.nome
  AND c.vendedor_responsavel_id IS NULL
  AND c.vendedor_responsavel IS NOT NULL;

-- Verifica os dados
SELECT 
    COUNT(*) as total_clientes,
    COUNT(vendedor_responsavel) as com_vendedor_nome,
    COUNT(vendedor_responsavel_id) as com_vendedor_id,
    COUNT(*) FILTER (WHERE vendedor_responsavel IS NOT NULL AND vendedor_responsavel_id IS NULL) as inconsistencias
FROM clientes;

COMMIT;
