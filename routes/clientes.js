// Arquivo: routes/clientes.js

/**
 * Módulo de Rotas para a entidade 'clientes'.
 * Define os endpoints da API e mapeia-os para as funções do Controller.
 */
const express = require('express');
const router = express.Router(); // Objeto especial do Express para gerir rotas
const clientesController = require('../controller/clientesController');

// O caminho base para estas rotas já foi definido em server.js como '/api/clientes'

// Rota para CRIAR um novo cliente (POST /api/clientes)
router.post('/', clientesController.createCliente);

// Rota para LER todos os clientes (GET /api/clientes)
router.get('/', clientesController.getAllClientes);

// ⚠️ IMPORTANTE: Rotas mais específicas devem vir ANTES das rotas genéricas com parâmetros

// Rota para buscar cliente por CNPJ (GET /api/clientes/cnpj/:cnpj)
// DEVE estar ANTES de /:id para não ser capturada por essa rota genérica
router.get('/cnpj/:cnpj', clientesController.getClienteByCnpj);

// Rota para LER relatório completo de um cliente (GET /api/clientes/:id/relatorio)
// DEVE estar ANTES de /:id para não ser capturada por essa rota genérica
router.get('/:id/relatorio', clientesController.getClienteRelatorio);

// Rotas de Calendário/Histórico do cliente (GET e PUT)
router.get('/:id/calendario', clientesController.getCalendario);
router.put('/:id/calendario', clientesController.updateCalendario);

// Rota para LER um cliente específico por ID (GET /api/clientes/:id)
// O ':id' é um parâmetro dinâmico na URL
router.get('/:id', clientesController.getClienteById);

// Rota para ATUALIZAR um cliente por ID (PUT /api/clientes/:id)
router.put('/:id', clientesController.updateCliente);

// Rota para DELETAR um cliente por ID (DELETE /api/clientes/:id)
router.delete('/:id', clientesController.deleteCliente);


// Exporta o router para ser usado no server.js
module.exports = router;