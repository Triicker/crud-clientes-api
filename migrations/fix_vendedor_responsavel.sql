-- Migration: Limpar e normalizar vendedores responsáveis
-- Data: 2025-12-08
-- Descrição: Remove vendedores inválidos e aplica regra de Prospecção

BEGIN;

-- 1. Criar tabela temporária para armazenar vendedores inválidos (auditoria)
CREATE TEMP TABLE vendedores_invalidos AS
SELECT DISTINCT vendedor_responsavel 
FROM clientes 
WHERE vendedor_responsavel IS NOT NULL
  AND vendedor_responsavel NOT IN (
      SELECT nome FROM usuarios WHERE ativo = true
  );

-- 2. Mostrar vendedores inválidos encontrados
DO $$
DECLARE
    v_count INTEGER;
    v_nome TEXT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM vendedores_invalidos;
    
    IF v_count > 0 THEN
        RAISE NOTICE '⚠️  Encontrados % vendedores inválidos:', v_count;
        
        FOR v_nome IN SELECT vendedor_responsavel FROM vendedores_invalidos LOOP
            RAISE NOTICE '   - %', v_nome;
        END LOOP;
    ELSE
        RAISE NOTICE '✅ Nenhum vendedor inválido encontrado';
    END IF;
END $$;

-- 3. Criar backup dos clientes que serão modificados
CREATE TEMP TABLE clientes_backup AS
SELECT * FROM clientes 
WHERE vendedor_responsavel IS NOT NULL
  AND (
      vendedor_responsavel NOT IN (SELECT nome FROM usuarios WHERE ativo = true)
      OR status = 'Prospecção'
  );

-- 4. Limpar vendedores inválidos (definir NULL)
UPDATE clientes 
SET vendedor_responsavel = NULL
WHERE vendedor_responsavel IS NOT NULL
  AND vendedor_responsavel NOT IN (
      SELECT nome FROM usuarios WHERE ativo = true
  );

-- 5. Aplicar regra de Prospecção (NULL para clientes em Prospecção)
UPDATE clientes 
SET vendedor_responsavel = NULL
WHERE status = 'Prospecção'
  AND vendedor_responsavel IS NOT NULL;

-- 6. Mostrar estatísticas finais
DO $$
DECLARE
    v_total_clientes INTEGER;
    v_com_vendedor INTEGER;
    v_sem_vendedor INTEGER;
    v_prospeccao_com_vendedor INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_clientes FROM clientes;
    SELECT COUNT(*) INTO v_com_vendedor FROM clientes WHERE vendedor_responsavel IS NOT NULL;
    SELECT COUNT(*) INTO v_sem_vendedor FROM clientes WHERE vendedor_responsavel IS NULL;
    SELECT COUNT(*) INTO v_prospeccao_com_vendedor 
    FROM clientes 
    WHERE status = 'Prospecção' AND vendedor_responsavel IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Estatísticas após migração:';
    RAISE NOTICE '   Total de clientes: %', v_total_clientes;
    RAISE NOTICE '   Com vendedor: %', v_com_vendedor;
    RAISE NOTICE '   Sem vendedor: %', v_sem_vendedor;
    RAISE NOTICE '   Prospecção com vendedor (deveria ser 0): %', v_prospeccao_com_vendedor;
    RAISE NOTICE '';
END $$;

-- 7. Validação final
DO $$
DECLARE
    v_invalidos INTEGER;
BEGIN
    -- Verificar se ainda existem vendedores inválidos
    SELECT COUNT(*) INTO v_invalidos
    FROM clientes
    WHERE vendedor_responsavel IS NOT NULL
      AND vendedor_responsavel NOT IN (SELECT nome FROM usuarios WHERE ativo = true);
    
    IF v_invalidos > 0 THEN
        RAISE EXCEPTION '❌ Ainda existem % clientes com vendedores inválidos!', v_invalidos;
    END IF;
    
    -- Verificar se Prospecção está limpo
    SELECT COUNT(*) INTO v_invalidos
    FROM clientes
    WHERE status = 'Prospecção' AND vendedor_responsavel IS NOT NULL;
    
    IF v_invalidos > 0 THEN
        RAISE EXCEPTION '❌ Ainda existem % clientes em Prospecção com vendedor!', v_invalidos;
    END IF;
    
    RAISE NOTICE '✅ Validação concluída: todos os dados estão corretos!';
END $$;

-- 8. Adicionar índice para melhorar performance das consultas por vendedor
CREATE INDEX IF NOT EXISTS idx_clientes_vendedor_responsavel 
ON clientes(vendedor_responsavel) 
WHERE vendedor_responsavel IS NOT NULL;

DO $$
BEGIN
    RAISE NOTICE '✅ Índice criado para melhorar performance';
END $$;

COMMIT;

-- Para reverter esta migration (CUIDADO!):
-- BEGIN;
-- SELECT * FROM clientes_backup; -- Ver backup
-- -- Restaurar manualmente se necessário
-- ROLLBACK;
