// Arquivo: routes/usuarios.js

/**
 * Módulo de Rotas para a entidade 'usuarios'.
 */
const express = require('express');
const router = express.Router();
const usuariosController = require('../controller/usuariosController');

// O caminho base para estas rotas será definido no server.js (sugestão: '/api/usuarios')

// Rota para CRIAR um novo utilizador (POST)
router.post('/', usuariosController.createUsuario);

// Rota para LER todos os utilizadores (GET)
router.get('/', usuariosController.getAllUsuarios);

// Rota para LER um utilizador específico por ID (GET /:id)
router.get('/:id', usuariosController.getUsuarioById);

// Rota para ATUALIZAR um utilizador por ID (PUT /:id)
router.put('/:id', usuariosController.updateUsuario);

// Rota para DELETAR um utilizador por ID (DELETE /:id)
router.delete('/:id', usuariosController.deleteUsuario);

module.exports = router;