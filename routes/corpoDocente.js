// Arquivo: routes/corpoDocente.js

/**
 * Módulo de Rotas para a entidade 'corpo_docente'.
 */
const express = require('express');
const router = express.Router();
const docenteController = require('../controller/corpoDocenteController');

// O caminho base para estas rotas será definido no server.js (sugestão: '/api/docentes')

// Rota para CRIAR um novo docente (POST)
router.post('/', docenteController.createDocente);

// Rota para LER todos os docentes (GET)
router.get('/', docenteController.getAllDocentes);

// Rota para LER um docente específico por ID (GET /:id)
router.get('/:id', docenteController.getDocenteById);

// Rota para ATUALIZAR um docente por ID (PUT /:id)
router.put('/:id', docenteController.updateDocente);

// Rota para DELETAR um docente por ID (DELETE /:id)
router.delete('/:id', docenteController.deleteDocente);

module.exports = router;