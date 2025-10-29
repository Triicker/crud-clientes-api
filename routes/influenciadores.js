// Arquivo: routes/influenciadores.js

/**
 * Módulo de Rotas para a entidade 'influenciadores'.
 */
const express = require('express');
const router = express.Router();
const influenciadoresController = require('../controller/influenciadoresController');

// O caminho base para estas rotas será definido no server.js (sugestão: '/api/influenciadores')

// Rota para CRIAR um novo influenciador (POST)
router.post('/', influenciadoresController.createInfluenciador);

// Rota para LER todos os influenciadores (GET)
router.get('/', influenciadoresController.getAllInfluenciadores);

// Rota para LER um influenciador específico por ID (GET /:id)
router.get('/:id', influenciadoresController.getInfluenciadorById);

// Rota para ATUALIZAR um influenciador por ID (PUT /:id)
router.put('/:id', influenciadoresController.updateInfluenciador);

// Rota para DELETAR um influenciador por ID (DELETE /:id)
router.delete('/:id', influenciadoresController.deleteInfluenciador);

module.exports = router;