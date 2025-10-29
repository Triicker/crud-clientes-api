// Arquivo: routes/programasFinanceiros.js

/**
 * Módulo de Rotas para a entidade 'programas_financeiros'.
 */
const express = require('express');
const router = express.Router();
const programasController = require('../controller/programasFinanceirosController');

// O caminho base para estas rotas será definido no server.js (sugestão: '/api/financeiros')

// Rota para CRIAR um novo programa (POST)
router.post('/', programasController.createPrograma);

// Rota para LER todos os programas (GET)
router.get('/', programasController.getAllProgramas);

// Rota para LER um programa específico por ID (GET /:id)
router.get('/:id', programasController.getProgramaById);

// Rota para ATUALIZAR um programa por ID (PUT /:id)
router.put('/:id', programasController.updatePrograma);

// Rota para DELETAR um programa por ID (DELETE /:id)
router.delete('/:id', programasController.deletePrograma);

module.exports = router;