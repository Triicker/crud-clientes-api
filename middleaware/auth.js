// Arquivo: middleware/auth.js

/**
 * Middleware para verificar o JWT e proteger rotas.
 * Verifica se o token é válido e anexa os dados do usuário à requisição (req.usuario).
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_super_secreto_aqui';

// Log de aviso se JWT_SECRET não estiver definido
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET não definido! Usando valor padrão (INSEGURO em produção)');
}

module.exports = (req, res, next) => {
    console.log('🔐 Middleware Auth - Verificando token...');
    
    // O token é geralmente enviado no cabeçalho 'Authorization' como 'Bearer [token]'
    const authHeader = req.headers.authorization;

    // 1. Verificar se o cabeçalho de autorização existe
    if (!authHeader) {
        console.error('❌ Auth: Token não fornecido');
        return res.status(401).json({ mensagem: 'Acesso negado. Token não fornecido.' });
    }

    // 2. Extrair o token (ignorar 'Bearer')
    const token = authHeader.split(' ')[1];
    
    if (!token) {
        console.error('❌ Auth: Token vazio após split');
        return res.status(401).json({ mensagem: 'Token mal formatado.' });
    }

    try {
        // 3. Verificar e decodificar o token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        console.log('✅ Auth: Token válido para usuário:', decoded.id, decoded.nome, 'perfil_id:', decoded.perfil_id);
        
        // 4. Anexar os dados do usuário à requisição (req.usuario)
        // Isso permite que os Controllers saibam quem fez a requisição
        req.usuario = decoded; 

        // 5. Continuar para o próximo middleware ou Controller
        next();

    } catch (error) {
        console.error('❌ Auth: Erro ao verificar token:', error.message);
        // Se o token for inválido, expirado, ou a chave secreta não corresponder
        return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
    }
};