// Arquivo: routes/equipePedagogica.js

/**
 * Módulo de Rotas para a entidade 'equipe_pedagogica'.
 */
const express = require('express');
const router = express.Router();
const equipeController = require('../controller/equipePedagogicaController');

// O caminho base para estas rotas será definido no server.js (sugestão: '/api/equipe')

// Rota para CRIAR um novo membro (POST)
router.post('/', equipeController.createMembro);

// Rota para LER todos os membros (GET)
router.get('/', equipeController.getAllMembros);

// Rota para LER um membro específico por ID (GET /:id)
router.get('/:id', equipeController.getMembroById);

// Rota para ATUALIZAR um membro por ID (PUT /:id)
router.put('/:id', equipeController.updateMembro);

// Rota para DELETAR um membro por ID (DELETE /:id)
router.delete('/:id', equipeController.deleteMembro);

module.exports = router;