/**
 * Rotas para gestão de equipe
 * Observações, métricas e acompanhamento de vendedores
 */
const express = require('express');
const router = express.Router();
const gestaoEquipeController = require('../controller/gestaoEquipeController');
const auth = require('../middleaware/auth');

// Todas as rotas requerem autenticação

// ===== USUÁRIOS E MÉTRICAS =====
// GET - Listar todos os usuários com métricas
router.get('/usuarios', auth, gestaoEquipeController.getUsuariosComMetricas);

// GET - Detalhes completos de um usuário
router.get('/usuarios/:id', auth, gestaoEquipeController.getUsuarioDetalhado);

// PUT - Atualizar meta de vendas de um usuário
router.put('/usuarios/:id/meta', auth, gestaoEquipeController.atualizarMeta);

// PUT - Atualizar observação geral do usuário
router.put('/usuarios/:id/observacao-geral', auth, gestaoEquipeController.atualizarObservacaoGeral);

// ===== OBSERVAÇÕES =====
// POST - Criar observação sobre um usuário
router.post('/observacoes', auth, gestaoEquipeController.criarObservacao);

// GET - Listar observações de um usuário
router.get('/observacoes/:usuario_id', auth, gestaoEquipeController.getObservacoes);

// PUT - Atualizar observação
router.put('/observacoes/:id', auth, gestaoEquipeController.atualizarObservacao);

// DELETE - Deletar observação
router.delete('/observacoes/:id', auth, gestaoEquipeController.deletarObservacao);

// ===== RANKING E ESTATÍSTICAS =====
// GET - Ranking de vendedores
router.get('/ranking', auth, gestaoEquipeController.getRanking);

// GET - Estatísticas gerais da equipe
router.get('/estatisticas', auth, gestaoEquipeController.getEstatisticasEquipe);

module.exports = router;
