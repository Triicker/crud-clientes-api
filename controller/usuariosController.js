// Arquivo: controller/usuariosController.js (MODIFICADO)

const pool = require('../config/db');
const bcrypt = require('bcryptjs'); // Importa a biblioteca de criptografia

// O número de 'salt rounds' determina o quão seguro (e lento) o hashing será.
// 10 é um bom valor padrão.
const saltRounds = 10;

// O SELECT BASE agora usa JOIN para obter o nome do perfil
const BASE_SELECT = `
    SELECT 
        u.id, 
        u.nome, 
        u.email, 
        p.nome AS perfil_nome, -- Alias para o nome do perfil
        u.perfil_id             -- O ID do perfil também é útil
    FROM usuarios u
    JOIN perfis p ON u.perfil_id = p.id
`;


// 1. CREATE (Registar um novo utilizador)
exports.createUsuario = async (req, res) => {
  // A requisição agora deve enviar 'perfil_id' (ex: 1, 2, 3) em vez de 'perfil' (ex: "administrador")
  const { nome, email, senha, perfil_id } = req.body; 

  try {
    const senha_hash = await bcrypt.hash(senha, saltRounds);

    const query = `
      INSERT INTO usuarios (nome, email, senha_hash, perfil_id) -- Altera para perfil_id
      VALUES ($1, $2, $3, $4)
      RETURNING id, nome, email, perfil_id;
    `;
    const values = [nome, email, senha_hash, perfil_id]; // Passa o ID

    const result = await pool.query(query, values);
    
    // Para retornar o nome do perfil na resposta, fazemos um novo SELECT ou ajustamos o retorno
    const novoUsuario = await pool.query(`${BASE_SELECT} WHERE u.id = $1`, [result.rows[0].id]);


    res.status(201).json({
      mensagem: 'Usuário criado com sucesso!',
      usuario: novoUsuario.rows[0]
    });
  } catch (error) {
    // ... (tratamento de erros)
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ erro: 'Erro interno do servidor ao criar usuário.' });
  }
};


// 2. READ ALL (Obter todos os utilizadores)
exports.getAllUsuarios = async (req, res) => {
  try {
    const result = await pool.query(`${BASE_SELECT} ORDER BY u.nome ASC`); // Usa o SELECT BASE com JOIN

    res.status(200).json(result.rows);
  } catch (error) {
    // ...
  }
};


// 3. READ ONE (Obter um utilizador por ID)
exports.getUsuarioById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`${BASE_SELECT} WHERE u.id = $1`, [id]); // Usa o SELECT BASE com WHERE

    // ... (restante do código)
  } catch (error) {
    // ...
  }
};


// 4. UPDATE (Atualizar um utilizador)
exports.updateUsuario = async (req, res) => {
  const { id } = req.params;
  // Agora espera perfil_id no corpo da requisição
  const { nome, email, senha, perfil_id } = req.body; 
  let senha_hash = null;

  try {
    if (senha) {
      senha_hash = await bcrypt.hash(senha, saltRounds);
    }
    
    let query;
    let values;

    if (senha_hash) {
      // Atualiza nome, email, perfil_id E senha
      query = `
        UPDATE usuarios
        SET nome = $1, email = $2, senha_hash = $3, perfil_id = $4 -- Atualiza perfil_id
        WHERE id = $5
        RETURNING id; -- Retornamos apenas o ID para buscar o objeto completo
      `;
      values = [nome, email, senha_hash, perfil_id, id];
    } else {
      // Atualiza apenas nome, email e perfil_id
      query = `
        UPDATE usuarios
        SET nome = $1, email = $2, perfil_id = $3 -- Atualiza perfil_id
        WHERE id = $4
        RETURNING id; -- Retornamos apenas o ID para buscar o objeto completo
      `;
      values = [nome, email, perfil_id, id];
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado para atualização.' });
    }
    
    // Faz um novo SELECT com JOIN para obter o nome do perfil
    const usuarioAtualizado = await pool.query(`${BASE_SELECT} WHERE u.id = $1`, [id]);


    res.status(200).json({
      mensagem: 'Usuário atualizado com sucesso!',
      usuario: usuarioAtualizado.rows[0]
    });
  } catch (error) {
    // ...
  }
};

// 5. DELETE (Excluir um utilizador)
exports.deleteUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado para exclusão.' });
    }

    res.status(200).json({ mensagem: 'Usuário excluído com sucesso!' });
  } catch (error) {
    console.error(`Erro ao excluir usuário com ID ${id}:`, error);
    res.status(500).json({ erro: 'Erro interno do servidor ao excluir usuário.' });
  }
};