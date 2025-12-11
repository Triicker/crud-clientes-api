-- Script para sincronizar vendedor_responsavel_id com vendedor_responsavel
-- Corrige inconsistências onde o nome está preenchido mas o ID não

BEGIN;

-- Sincroniza vendedor_responsavel_id baseado no vendedor_responsavel
UPDATE clientes c
SET vendedor_responsavel_id = u.id
FROM usuarios u
WHERE c.vendedor_responsavel = u.nome
  AND c.vendedor_responsavel_id IS NULL
  AND c.vendedor_responsavel IS NOT NULL;

-- Mostra resultado
SELECT 
    'Clientes sincronizados' as operacao,
    COUNT(*) as total
FROM clientes
WHERE vendedor_responsavel IS NOT NULL 
  AND vendedor_responsavel_id IS NOT NULL;

-- Mostra clientes ainda com inconsistência
SELECT 
    'Inconsistências restantes' as operacao,
    COUNT(*) as total
FROM clientes
WHERE (vendedor_responsavel IS NOT NULL AND vendedor_responsavel_id IS NULL)
   OR (vendedor_responsavel IS NULL AND vendedor_responsavel_id IS NOT NULL);

COMMIT;
