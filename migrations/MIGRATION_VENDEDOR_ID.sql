-- =====================================================
-- MIGRATION: Adicionar coluna vendedor_responsavel_id
-- Data: 2025-12-09
-- =====================================================

-- PASSO 1: Adiciona a coluna (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'vendedor_responsavel_id'
    ) THEN
        ALTER TABLE clientes ADD COLUMN vendedor_responsavel_id INTEGER;
        RAISE NOTICE '✅ Coluna vendedor_responsavel_id criada com sucesso';
    ELSE
        RAISE NOTICE '⚠️  Coluna vendedor_responsavel_id já existe';
    END IF;
END $$;

-- PASSO 2: Adiciona constraint de chave estrangeira (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'clientes' 
        AND constraint_name = 'fk_vendedor_responsavel'
    ) THEN
        ALTER TABLE clientes 
        ADD CONSTRAINT fk_vendedor_responsavel 
        FOREIGN KEY (vendedor_responsavel_id) 
        REFERENCES usuarios(id) 
        ON DELETE SET NULL;
        RAISE NOTICE '✅ Constraint fk_vendedor_responsavel criada';
    ELSE
        RAISE NOTICE '⚠️  Constraint fk_vendedor_responsavel já existe';
    END IF;
END $$;

-- PASSO 3: Cria índice para melhorar performance
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'clientes' 
        AND indexname = 'idx_clientes_vendedor_responsavel_id'
    ) THEN
        CREATE INDEX idx_clientes_vendedor_responsavel_id 
        ON clientes(vendedor_responsavel_id);
        RAISE NOTICE '✅ Índice idx_clientes_vendedor_responsavel_id criado';
    ELSE
        RAISE NOTICE '⚠️  Índice idx_clientes_vendedor_responsavel_id já existe';
    END IF;
END $$;

-- PASSO 4: Atualiza clientes existentes (mapeia nome → ID)
UPDATE clientes c
SET vendedor_responsavel_id = u.id
FROM usuarios u
WHERE c.vendedor_responsavel = u.nome
  AND c.vendedor_responsavel_id IS NULL
  AND c.vendedor_responsavel IS NOT NULL;

-- PASSO 5: Verifica o resultado
SELECT 
    COUNT(*) as total_clientes,
    COUNT(vendedor_responsavel) as com_vendedor_nome,
    COUNT(vendedor_responsavel_id) as com_vendedor_id,
    COUNT(*) FILTER (WHERE vendedor_responsavel IS NOT NULL AND vendedor_responsavel_id IS NULL) as inconsistencias
FROM clientes;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Abra pgAdmin ou psql
-- 2. Conecte no banco 'etica_vendas'
-- 3. Execute este arquivo SQL completo
-- 4. Verifique a última query SELECT para ver o resultado
-- =====================================================
