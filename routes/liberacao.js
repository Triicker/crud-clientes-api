/**
 * Rotas para gerenciamento de liberação de etapas
 */
const express = require('express');
const router = express.Router();
const liberacaoController = require('../controller/liberacaoController');
const auth = require('../middleaware/auth');

// Todas as rotas requerem autenticação

// GET - Obter configuração das etapas
router.get('/etapas', auth, liberacaoController.getEtapasConfig);

// GET - Obter todos os perfis
router.get('/perfis', auth, liberacaoController.getPerfis);

// GET - Verificar permissão para avançar para uma etapa
router.get('/verificar/:cliente_id/:etapa_destino', auth, liberacaoController.verificarPermissaoAvancar);

// GET - Verificar status de liberação de uma etapa específica para um cliente
router.get('/status/:cliente_id/:etapa_id', auth, liberacaoController.verificarStatusLiberacao);

// POST - Solicitar liberação para avançar etapa
router.post('/solicitar', auth, liberacaoController.solicitarLiberacao);

// PUT - Aprovar ou rejeitar liberação
router.put('/processar/:id', auth, liberacaoController.processarLiberacao);

// PUT - Aprovar liberação (atalho)
router.put('/:id/aprovar', auth, async (req, res) => {
    req.body.acao = 'aprovar';
    return liberacaoController.processarLiberacao(req, res);
});

// PUT - Rejeitar liberação (atalho)
router.put('/:id/rejeitar', auth, async (req, res) => {
    req.body.acao = 'rejeitar';
    return liberacaoController.processarLiberacao(req, res);
});

// GET - Listar liberações pendentes
router.get('/pendentes', auth, liberacaoController.getLiberacoesPendentes);

// GET - Histórico de liberações de um cliente
router.get('/historico/:cliente_id', auth, liberacaoController.getHistoricoLiberacoes);

module.exports = router;
