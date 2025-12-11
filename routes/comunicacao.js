const express = require('express');
const router = express.Router();
const comunicacaoController = require('../controller/comunicacaoController');
const auth = require('../middleaware/auth');

// Buscar todos os usuários
router.get('/usuarios', auth, comunicacaoController.getTodosUsuarios);

// Dashboard de comunicações
router.get('/dashboard', auth, comunicacaoController.getDashboardComunicacoes);

// Criar nova comunicação (comentário, tarefa, validação)
router.post('/', auth, comunicacaoController.criarComunicacao);

// Buscar comunicações do usuário logado
router.get('/minhas', auth, comunicacaoController.getComunicacoesUsuario);

// Buscar comunicações de um cliente específico
router.get('/cliente/:clienteId', auth, comunicacaoController.getComunicacoesCliente);

// Atualizar status de uma comunicação
router.put('/:id/status', auth, comunicacaoController.atualizarStatusComunicacao);

module.exports = router;