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

// Rota para LER um cliente específico por ID (GET /api/clientes/:id)
// O ':id' é um parâmetro dinâmico na URL
router.get('/:id', clientesController.getClienteById);

// Rota para ATUALIZAR um cliente por ID (PUT /api/clientes/:id)
router.put('/:id', clientesController.updateCliente);

// Rota para DELETAR um cliente por ID (DELETE /api/clientes/:id)
router.delete('/:id', clientesController.deleteCliente);

// Exporta o router para ser usado no server.js
module.exports = router;