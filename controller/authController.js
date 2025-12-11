// Arquivo: controller/authController.js

/**
 * Módulo de Controller para a autenticação (Login) de usuários.
 * Lida com a verificação de senha e geração de JSON Web Token (JWT).
 */
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const responseFormatter = require('../utils/responseFormatter');
const logger = require('../utils/logger');

// A chave secreta é carregada do ambiente (.env)
const JWT_SECRET = process.env.JWT_SECRET; 

exports.login = async (req, res) => {
    const { email, senha } = req.body;

    try {
        // 1. BUSCAR O USUÁRIO PELO EMAIL
        // Nota: Precisamos da senha_hash aqui para a comparação
        const query = `
            SELECT u.id, u.nome, u.email, u.senha_hash, u.perfil_id, p.nome AS perfil_nome
            FROM usuarios u
            JOIN perfis p ON u.perfil_id = p.id
            WHERE u.email = $1;
        `;
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            // Mensagem genérica para segurança
            return res.status(401).json(responseFormatter.unauthorized('Credenciais inválidas'));
        }

        const usuario = result.rows[0];

        // 2. COMPARAR A SENHA FORNECIDA COM O HASH ARMAZENADO
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaCorreta) {
            return res.status(401).json(responseFormatter.unauthorized('Credenciais inválidas'));
        }

        // 3. GERAR O JSON WEB TOKEN (JWT)
        const token = jwt.sign(
            { 
                id: usuario.id, 
                nome: usuario.nome,
                email: usuario.email, 
                perfil_id: usuario.perfil_id,
                perfil: usuario.perfil_nome 
            }, 
            JWT_SECRET, 
            { 
                expiresIn: '8h' // O token expira após 8 horas
            }
        );

        // 4. RETORNAR O TOKEN E OS DADOS DO USUÁRIO (SEM O HASH!)
        // Removemos o hash antes de enviar a resposta
        delete usuario.senha_hash; 

        logger.info('Login realizado com sucesso', { usuarioId: usuario.id, email: usuario.email });
        res.status(200).json(responseFormatter.success({
            token: token,
            usuario: usuario
        }, 'Login realizado com sucesso'));

    } catch (error) {
        logger.error('Erro durante o login', error);
        res.status(500).json(responseFormatter.error('Erro interno do servidor durante o processo de autenticação'));
    }
};