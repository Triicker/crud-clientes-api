// Arquivo: routes/interacoes.js

const express = require('express');
const router = express.Router();
const interacoesController = require('../controller/interacoesController');

// Rota para CRIAR uma nova interação (POST /api/interacoes)
router.post('/', interacoesController.createInteracao);

// Rota para LER interações de um cliente (GET /api/interacoes/cliente/:clienteId)
router.get('/cliente/:clienteId', interacoesController.getInteracoesByCliente);

// Rota para DELETAR uma interação (DELETE /api/interacoes/:id)
router.delete('/:id', interacoesController.deleteInteracao);

module.exports = router;
