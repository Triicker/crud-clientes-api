const express = require('express');
const router = express.Router();
const historicoController = require('../controller/historicoController');
const auth = require('../middleaware/auth');

// POST - Registrar novo histórico (chamado automaticamente ao marcar/desmarcar tarefas)
router.post('/registrar', auth, historicoController.registrarHistorico);

// GET - Buscar histórico de um cliente específico
router.get('/cliente/:clienteId', auth, historicoController.getHistoricoCliente);

// GET - Buscar histórico geral com filtros
router.get('/geral', auth, historicoController.getHistoricoGeral);

// GET - Estatísticas do histórico de um cliente
router.get('/estatisticas/:clienteId', auth, historicoController.getEstatisticasHistorico);

module.exports = router;
