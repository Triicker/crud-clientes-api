/**
 * Script helper para migrar controllers para usar responseFormatter e logger
 * 
 * Este script fornece exemplos de padrões de substituição para facilitar
 * a migração dos controllers restantes.
 */

// ============================================================================
// IMPORTS - Adicionar no topo do controller
// ============================================================================

const responseFormatter = require('../utils/responseFormatter');
const logger = require('../utils/logger');

// ============================================================================
// PADRÕES DE SUBSTITUIÇÃO
// ============================================================================

// --- RESPOSTAS DE SUCESSO (200, 201) ---

// ANTES:
res.status(200).json(result.rows);
res.status(200).json({ mensagem: 'Sucesso', data: result.rows[0] });
res.status(201).json(result.rows[0]);

// DEPOIS:
res.status(200).json(responseFormatter.success(result.rows, 'Lista recuperada com sucesso'));
res.status(200).json(responseFormatter.success(result.rows[0], 'Operação realizada com sucesso'));
res.status(201).json(responseFormatter.success(result.rows[0], 'Item criado com sucesso'));


// --- RESPOSTAS DE ERRO 404 (NOT FOUND) ---

// ANTES:
res.status(404).json({ mensagem: 'Cliente não encontrado.' });
res.status(404).json({ erro: 'Recurso não encontrado.' });

// DEPOIS:
res.status(404).json(responseFormatter.notFound('Cliente'));
res.status(404).json(responseFormatter.notFound('Recurso'));


// --- RESPOSTAS DE ERRO 400 (VALIDATION) ---

// ANTES:
res.status(400).json({ erro: 'Dados inválidos', detalhes: { campo: 'mensagem' } });

// DEPOIS:
res.status(400).json(responseFormatter.validationError(
    'Dados inválidos',
    { campo: 'mensagem de erro específica' }
));


// --- RESPOSTAS DE ERRO 401 (UNAUTHORIZED) ---

// ANTES:
res.status(401).json({ mensagem: 'Não autorizado.' });
res.status(401).json({ erro: 'Token inválido.' });

// DEPOIS:
res.status(401).json(responseFormatter.unauthorized('Credenciais inválidas'));
res.status(401).json(responseFormatter.unauthorized('Token inválido'));


// --- RESPOSTAS DE ERRO 403 (FORBIDDEN) ---

// ANTES:
res.status(403).json({ mensagem: 'Acesso negado.' });

// DEPOIS:
res.status(403).json(responseFormatter.forbidden('Acesso negado'));


// --- RESPOSTAS DE ERRO 500 (INTERNAL ERROR) ---

// ANTES:
res.status(500).json({ erro: 'Erro interno do servidor.' });
res.status(500).json({ erro: 'Erro ao processar requisição.', message: error.message });

// DEPOIS:
res.status(500).json(responseFormatter.error('Erro interno do servidor'));
res.status(500).json(responseFormatter.error('Erro ao processar requisição', error.message));


// --- LOGGING ---

// ANTES:
console.log('✅ Item criado:', item.id);
console.log('📋 Processando dados:', data);
console.error('Erro ao processar:', error);
console.error('Erro:', error.message);

// DEPOIS:
logger.info('Item criado com sucesso', { itemId: item.id });
logger.debug('Processando dados', { data });
logger.error('Erro ao processar', error);
logger.error('Erro ao processar', new Error(error.message));

// LEVELS:
// logger.error(message, error)   - Erros críticos (sempre exibidos)
// logger.warn(message, context)  - Avisos importantes
// logger.info(message, context)  - Informações gerais (padrão produção)
// logger.debug(message, context) - Debug detalhado (apenas desenvolvimento)


// ============================================================================
// EXEMPLOS COMPLETOS DE MIGRAÇÃO
// ============================================================================

// --- EXEMPLO 1: Método GET simples ---

// ANTES:
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar items:', error);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
};

// DEPOIS:
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items');
    res.status(200).json(responseFormatter.success(result.rows, 'Items recuperados com sucesso'));
  } catch (error) {
    logger.error('Erro ao buscar items', error);
    res.status(500).json(responseFormatter.error('Erro interno do servidor'));
  }
};


// --- EXEMPLO 2: Método GET por ID ---

// ANTES:
exports.getById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Item não encontrado.' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Erro ao buscar item ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
};

// DEPOIS:
exports.getById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(responseFormatter.notFound('Item'));
    }
    
    res.status(200).json(responseFormatter.success(result.rows[0], 'Item recuperado com sucesso'));
  } catch (error) {
    logger.error(`Erro ao buscar item com ID ${id}`, error);
    res.status(500).json(responseFormatter.error('Erro interno do servidor'));
  }
};


// --- EXEMPLO 3: Método POST (Create) ---

// ANTES:
exports.create = async (req, res) => {
  const { nome, descricao } = req.body;
  
  console.log('Criando item:', { nome, descricao });
  
  try {
    const query = 'INSERT INTO items (nome, descricao) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(query, [nome, descricao]);
    
    console.log('✅ Item criado:', result.rows[0].id);
    res.status(201).json({ mensagem: 'Item criado com sucesso', item: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar item:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ erro: 'Item já existe.' });
    }
    
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
};

// DEPOIS:
exports.create = async (req, res) => {
  const { nome, descricao } = req.body;
  
  logger.debug('Criando item', { nome, descricao });
  
  try {
    const query = 'INSERT INTO items (nome, descricao) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(query, [nome, descricao]);
    
    logger.info('Item criado com sucesso', { itemId: result.rows[0].id });
    res.status(201).json(responseFormatter.success(result.rows[0], 'Item criado com sucesso'));
  } catch (error) {
    logger.error('Erro ao criar item', error);
    
    if (error.code === '23505') {
      return res.status(409).json(responseFormatter.error('Item já existe'));
    }
    
    res.status(500).json(responseFormatter.error('Erro interno do servidor'));
  }
};


// --- EXEMPLO 4: Método PUT (Update) ---

// ANTES:
exports.update = async (req, res) => {
  const { id } = req.params;
  const { nome, descricao } = req.body;
  
  try {
    const query = 'UPDATE items SET nome = $1, descricao = $2 WHERE id = $3 RETURNING *';
    const result = await pool.query(query, [nome, descricao, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Item não encontrado.' });
    }
    
    console.log('✅ Item atualizado:', id);
    res.status(200).json({ mensagem: 'Item atualizado com sucesso', item: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
};

// DEPOIS:
exports.update = async (req, res) => {
  const { id } = req.params;
  const { nome, descricao } = req.body;
  
  try {
    const query = 'UPDATE items SET nome = $1, descricao = $2 WHERE id = $3 RETURNING *';
    const result = await pool.query(query, [nome, descricao, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(responseFormatter.notFound('Item'));
    }
    
    logger.info('Item atualizado com sucesso', { itemId: id });
    res.status(200).json(responseFormatter.success(result.rows[0], 'Item atualizado com sucesso'));
  } catch (error) {
    logger.error('Erro ao atualizar item', error);
    res.status(500).json(responseFormatter.error('Erro interno do servidor'));
  }
};


// --- EXEMPLO 5: Método DELETE ---

// ANTES:
exports.delete = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Item não encontrado.' });
    }
    
    console.log('✅ Item excluído:', id);
    res.status(200).json({ mensagem: 'Item excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir item:', error);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
};

// DEPOIS:
exports.delete = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json(responseFormatter.notFound('Item'));
    }
    
    logger.info('Item excluído', { itemId: id });
    res.status(200).json(responseFormatter.success(null, 'Item excluído com sucesso'));
  } catch (error) {
    logger.error('Erro ao excluir item', error);
    res.status(500).json(responseFormatter.error('Erro interno do servidor'));
  }
};


// ============================================================================
// COMANDOS ÚTEIS
// ============================================================================

/*
# Encontrar todos os console.log/error em controllers:
Select-String -Path "controller/*.js" -Pattern "console\.(log|error|warn|info)" | Select-Object Path, LineNumber, Line

# Contar quantos console.log existem:
(Select-String -Path "controller/*.js" -Pattern "console\.log").Count

# Verificar erros após migração:
node server.js

# Testar endpoint migrado:
curl http://localhost:5000/api/items
*/

// ============================================================================
// CHECKLIST DE MIGRAÇÃO POR CONTROLLER
// ============================================================================

/*
Para cada controller:

1. [ ] Adicionar imports (responseFormatter, logger)
2. [ ] Substituir res.status(200).json() por responseFormatter.success()
3. [ ] Substituir res.status(404).json() por responseFormatter.notFound()
4. [ ] Substituir res.status(400).json() por responseFormatter.validationError()
5. [ ] Substituir res.status(401).json() por responseFormatter.unauthorized()
6. [ ] Substituir res.status(500).json() por responseFormatter.error()
7. [ ] Substituir console.log por logger.info/debug
8. [ ] Substituir console.error por logger.error
9. [ ] Substituir console.warn por logger.warn
10. [ ] Testar endpoints do controller
11. [ ] Verificar se não há erros no VS Code
12. [ ] Marcar como concluído no README

Controllers pendentes:
- [ ] comunicacaoController.js
- [ ] corpoDocenteController.js
- [ ] diagnosticoController.js
- [ ] emailController.js
- [ ] equipePedagogicaController.js
- [ ] gestaoEquipeController.js
- [ ] historicoController.js
- [ ] influenciadoresController.js
- [ ] interacoesController.js
- [ ] liberacaoController.js
- [ ] propostasController.js
- [ ] tarefasController.js
- [ ] usuariosController.js
- [ ] vendedoresController.js
*/

console.log('📚 Helper script carregado! Use os exemplos acima para migrar os controllers.');
