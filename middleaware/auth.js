// Arquivo: middleware/auth.js

/**
 * Middleware para verificar o JWT e proteger rotas.
 * Verifica se o token é válido e anexa os dados do usuário à requisição (req.usuario).
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
    // O token é geralmente enviado no cabeçalho 'Authorization' como 'Bearer [token]'
    const authHeader = req.headers.authorization;

    // 1. Verificar se o cabeçalho de autorização existe
    if (!authHeader) {
        return res.status(401).json({ mensagem: 'Acesso negado. Token não fornecido.' });
    }

    // 2. Extrair o token (ignorar 'Bearer')
    const token = authHeader.split(' ')[1];

    try {
        // 3. Verificar e decodificar o token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 4. Anexar os dados do usuário à requisição (req.usuario)
        // Isso permite que os Controllers saibam quem fez a requisição
        req.usuario = decoded; 

        // 5. Continuar para o próximo middleware ou Controller
        next();

    } catch (error) {
        // Se o token for inválido, expirado, ou a chave secreta não corresponder
        return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
    }
};