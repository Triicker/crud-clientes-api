/**
 * Rotas para gestão de vendedores/usuários
 */
const express = require('express');
const router = express.Router();
const vendedoresController = require('../controller/vendedoresController');
const auth = require('../middleaware/auth');

// Todas as rotas requerem autenticação

// GET - Dashboard geral de vendedores
router.get('/dashboard', auth, vendedoresController.getDashboardVendedores);

// GET - Listar todos os usuários com estatísticas
router.get('/', auth, vendedoresController.getUsuariosComEstatisticas);

// GET - Detalhes de um usuário específico
router.get('/:id', auth, vendedoresController.getUsuarioDetalhes);

// PUT - Atualizar observação do gestor sobre um usuário
router.put('/:id/observacao', auth, vendedoresController.atualizarObservacao);

// PUT - Atualizar meta de vendas
router.put('/:id/meta', auth, vendedoresController.atualizarMeta);

// GET - Clientes de um vendedor específico (por nome)
router.get('/clientes/:nome', auth, vendedoresController.getClientesDoVendedor);

module.exports = router;
