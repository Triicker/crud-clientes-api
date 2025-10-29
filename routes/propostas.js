// Arquivo: routes/propostas.js

/**
 * Módulo de Rotas para a entidade 'propostas'.
 */
const express = require('express');
const router = express.Router();
const propostasController = require('../controller/propostasController');

// O caminho base para estas rotas será definido no server.js (sugestão: '/api/propostas')

// Rota para CRIAR uma nova proposta (POST)
router.post('/', propostasController.createProposta);

// Rota para LER todas as propostas (GET)
router.get('/', propostasController.getAllPropostas);

// Rota para LER uma proposta específica por ID (GET /:id)
router.get('/:id', propostasController.getPropostaById);

// Rota para ATUALIZAR uma proposta por ID (PUT /:id)
router.put('/:id', propostasController.updateProposta);

// Rota para DELETAR uma proposta por ID (DELETE /:id)
router.delete('/:id', propostasController.deleteProposta);

module.exports = router;