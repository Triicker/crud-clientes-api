// Arquivo: routes/diagnostico.js

/**
 * Módulo de Rotas para a entidade 'diagnostico'.
 */
const express = require('express');
const router = express.Router();
const diagnosticoController = require('../controller/diagnosticoController');

// O caminho base para estas rotas será definido no server.js (sugestão: '/api/diagnosticos')

// Rota para CRIAR um novo diagnóstico (POST)
router.post('/', diagnosticoController.createDiagnostico);

// Rota para LER todos os diagnósticos (GET)
router.get('/', diagnosticoController.getAllDiagnosticos);

// Rota para LER um diagnóstico específico por ID (GET /:id)
router.get('/:id', diagnosticoController.getDiagnosticoById);

// Rota para ATUALIZAR um diagnóstico por ID (PUT /:id)
router.put('/:id', diagnosticoController.updateDiagnostico);

// Rota para DELETAR um diagnóstico por ID (DELETE /:id)
router.delete('/:id', diagnosticoController.deleteDiagnostico);

module.exports = router;