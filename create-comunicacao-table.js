require('dotenv').config();
const db = require('./config/db');

async function criarTabelaComunicacao() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS comunicacao_equipe (
                id SERIAL PRIMARY KEY,
                cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
                usuario_remetente_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                usuario_destinatario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                tipo VARCHAR(50) NOT NULL, -- 'comentario', 'tarefa', 'validacao'
                titulo VARCHAR(255) NOT NULL,
                descricao TEXT,
                prioridade VARCHAR(20) DEFAULT 'media', -- 'baixa', 'media', 'alta', 'urgente'
                status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'em_andamento', 'concluida', 'cancelada'
                etapa_relacionada VARCHAR(100),
                data_prazo TIMESTAMP,
                resposta TEXT,
                tags JSONB,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_resposta TIMESTAMP,
                data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await db.query(createTableQuery);
        console.log('✅ Tabela comunicacao_equipe criada/verificada com sucesso');

        // Criar índices para melhorar a performance
        const indexQueries = [
            'CREATE INDEX IF NOT EXISTS idx_comunicacao_cliente_id ON comunicacao_equipe(cliente_id);',
            'CREATE INDEX IF NOT EXISTS idx_comunicacao_remetente_id ON comunicacao_equipe(usuario_remetente_id);',
            'CREATE INDEX IF NOT EXISTS idx_comunicacao_destinatario_id ON comunicacao_equipe(usuario_destinatario_id);',
            'CREATE INDEX IF NOT EXISTS idx_comunicacao_status ON comunicacao_equipe(status);',
            'CREATE INDEX IF NOT EXISTS idx_comunicacao_tipo ON comunicacao_equipe(tipo);',
            'CREATE INDEX IF NOT EXISTS idx_comunicacao_prioridade ON comunicacao_equipe(prioridade);',
            'CREATE INDEX IF NOT EXISTS idx_comunicacao_data_criacao ON comunicacao_equipe(data_criacao);'
        ];

        for (const indexQuery of indexQueries) {
            await db.query(indexQuery);
        }

        console.log('✅ Índices da tabela comunicacao_equipe criados com sucesso');

    } catch (error) {
        console.error('❌ Erro ao criar tabela comunicacao_equipe:', error);
    }
}

criarTabelaComunicacao();