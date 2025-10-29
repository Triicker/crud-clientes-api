// Arquivo: server.js

/**
 * Servidor principal da API.
 * Configura o Express, importa as rotas e inicia o servidor.
 */
const express = require('express');
const app = express();
const PORT = 3000; // A porta onde o teu servidor irá correr

// Importa o módulo de conexão com o DB para garantir que ele é executado e testado
require('./config/db');

// Middleware para analisar o corpo das requisições JSON
// Isso permite que o Express entenda os dados JSON enviados nas requisições POST e PUT
app.use(express.json());

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

// Rota de teste simples
app.get('/', (req, res) => {
  res.send('🎉 Servidor de CRUD Clientes em execução! Acesse /api/clientes');
});


// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor a correr na porta ${PORT}. Acessa http://localhost:${PORT}`);
});