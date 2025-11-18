require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
// Usa a porta definida na variável de ambiente (Render fornece automaticamente) ou fallback para 3000 localmente
const PORT = process.env.PORT || 3000;

// Importa o módulo de conexão com o DB para garantir que ele é executado e testado
require('./config/db');

// Middleware para analisar o corpo das requisições JSON
// Isso permite que o Express entenda os dados JSON enviados nas requisições POST e PUT
app.use(express.json());

// CORS (opcional) - Ative apenas quando front e backend estiverem em domínios diferentes
if (process.env.CORS_ENABLED === 'true') {
  const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
  app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  console.log(`🔐 CORS ativo para origem: ${allowedOrigin}`);
}

// Middleware de debug para logar todas as requisições
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.url}`);
  next();
});

// Middleware para servir arquivos estáticos da pasta 'vanilla-version' (compatível cross-platform)
const path = require('path');
app.use(express.static(path.join(__dirname, 'vanilla-version')));

// Exponibiliza a ferramenta de pesquisa de contratos em /SearchContratos
app.use('/SearchContratos', express.static(path.join(__dirname, 'SearchContratos')));

// Atalho direto para /search.html para manter a navegação independente
app.get('/search.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'SearchContratos', 'search.html'));
});

// Rota raiz redireciona para login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// --- ROTAS ---
// Vamos criar a rota para clientes no próximo passo
const clientesRoutes = require('./routes/clientes');
app.use('/api/clientes', clientesRoutes); // Todas as rotas definidas em clientes.js começarão com /api/clientes

const equipeRoutes = require('./routes/equipePedagogica');
app.use('/api/equipe', equipeRoutes);

const docentesRoutes = require('./routes/corpoDocente');
app.use('/api/docentes', docentesRoutes); // Rotas para Corpo Docente

const numerosRoutes = require('./routes/redeNumeros');
app.use('/api/numeros', numerosRoutes);

const programasRoutes = require('./routes/programasFinanceiros');
app.use('/api/financeiros', programasRoutes);

const propostasRoutes = require('./routes/propostas');
app.use('/api/propostas', propostasRoutes);

const diagnosticoRoutes = require('./routes/diagnostico');
app.use('/api/diagnosticos', diagnosticoRoutes);

const influenciadoresRoutes = require('./routes/influenciadores');
app.use('/api/influenciadores', influenciadoresRoutes);

const usuariosRoutes = require('./routes/usuarios');
app.use('/api/usuarios', usuariosRoutes);

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// E-mail
const emailRoutes = require('./routes/email');
app.use('/api/email', emailRoutes);


// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ativo na porta ${PORT}`);
});