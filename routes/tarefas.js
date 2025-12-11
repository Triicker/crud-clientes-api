// Arquivo: routes/tarefas.js

/**
 * Rotas para gerenciamento de tarefas da Esteira de Trabalho
 */
const express = require('express');
const router = express.Router();
const tarefasController = require('../controller/tarefasController');
const auth = require('../middleaware/auth'); // Middleware de autenticação

// Obter status e tarefas da esteira de um cliente
router.get('/clientes/:id/esteira', auth, tarefasController.getEsteiraCliente);

// Atualizar tarefas de um cliente (COM AUTH para auto-atribuir vendedor)
router.put('/clientes/:id/tarefas', auth, tarefasController.updateTarefas);

// Obter progresso geral
router.get('/tarefas/progresso', auth, tarefasController.getProgressoGeral);

module.exports = router;
