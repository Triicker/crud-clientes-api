// Arquivo: routes/auth.js

/**
 * Módulo de Rotas para a autenticação.
 */
const express = require('express');
const router = express.Router();
const authController = require('../controller/authController');

// Rota para Login (POST /api/auth/login)
router.post('/login', authController.login);

module.exports = router;