// Arquivo: routes/redeNumeros.js

/**
 * Módulo de Rotas para a entidade 'rede_numeros'.
 */
const express = require('express');
const router = express.Router();
const redeNumerosController = require('../controller/redeNumerosController');

// O caminho base para estas rotas será definido no server.js (sugestão: '/api/numeros')

// Rota para CRIAR um novo registro (POST)
router.post('/', redeNumerosController.createNumero);

// Rota para LER todos os registros (GET)
router.get('/', redeNumerosController.getAllNumeros);

// Rota para LER um registro específico por ID (GET /:id)
router.get('/:id', redeNumerosController.getNumeroById);

// Rota para ATUALIZAR um registro por ID (PUT /:id)
router.put('/:id', redeNumerosController.updateNumero);

// Rota para DELETAR um registro por ID (DELETE /:id)
router.delete('/:id', redeNumerosController.deleteNumero);

module.exports = router;