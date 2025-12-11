-- Migration for Sales Funnel (Funil de Vendas)

-- 1. Add columns to 'clientes' table
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Prospecção';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS vendedor_responsavel VARCHAR(100);

-- 2. Create 'interacoes' table for history
CREATE TABLE IF NOT EXISTS interacoes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'Nota', 'Email', 'Ligação', 'Reunião'
    descricao TEXT,
    data_interacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_responsavel VARCHAR(100) -- Name or ID of the user who made the interaction
);

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_interacoes_cliente_id ON interacoes(cliente_id);
