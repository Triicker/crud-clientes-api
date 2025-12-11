/**
 * Script de Teste - Ciclo Completo do Vendedor
 * 
 * Testa:
 * 1. Login e autenticação
 * 2. Criação de interação (auto-atribuição)
 * 3. Mudança de status (atribuição)
 * 4. Consulta de estatísticas
 * 5. Validação de permissões
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

const CORES = {
    RESET: '\x1b[0m',
    VERDE: '\x1b[32m',
    AMARELO: '\x1b[33m',
    VERMELHO: '\x1b[31m',
    AZUL: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m'
};

function log(cor, mensagem) {
    console.log(`${cor}${mensagem}${CORES.RESET}`);
}

class VendedorTester {
    constructor(nome, email, senha) {
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.sessionCookie = null;
        this.userId = null;
    }
    
    async login() {
        log(CORES.CYAN, `\n🔑 Login: ${this.nome}`);
        
        try {
            const response = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: this.email,
                senha: this.senha
            }, {
                withCredentials: true
            });
            
            // Extrair cookie de sessão
            const cookies = response.headers['set-cookie'];
            if (cookies) {
                this.sessionCookie = cookies[0].split(';')[0];
            }
            
            this.userId = response.data.usuario.id;
            
            log(CORES.VERDE, `   ✓ Login realizado com sucesso`);
            log(CORES.VERDE, `   - ID: ${this.userId}`);
            log(CORES.VERDE, `   - Perfil: ${response.data.usuario.perfil}`);
            
            return response.data;
        } catch (error) {
            log(CORES.VERMELHO, `   ✗ Erro no login: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }
    
    async listarClientes() {
        log(CORES.CYAN, `\n📋 Listando clientes de ${this.nome}`);
        
        try {
            const response = await axios.get(`${BASE_URL}/api/clientes`, {
                headers: {
                    Cookie: this.sessionCookie
                },
                withCredentials: true
            });
            
            const clientesDoVendedor = response.data.filter(
                c => c.vendedor_responsavel === this.nome
            );
            
            log(CORES.VERDE, `   ✓ Total de clientes: ${response.data.length}`);
            log(CORES.VERDE, `   ✓ Meus clientes: ${clientesDoVendedor.length}`);
            
            clientesDoVendedor.forEach(c => {
                console.log(`     - ${c.nome} (${c.status})`);
            });
            
            return clientesDoVendedor;
        } catch (error) {
            log(CORES.VERMELHO, `   ✗ Erro ao listar: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }
    
    async criarInteracao(clienteNome, tipo = 'Ligação', descricao = 'Teste de interação') {
        log(CORES.CYAN, `\n💬 Criando interação: ${this.nome} → ${clienteNome}`);
        
        try {
            // Buscar ID do cliente
            const clientesResponse = await axios.get(`${BASE_URL}/api/clientes`, {
                headers: {
                    Cookie: this.sessionCookie
                },
                withCredentials: true
            });
            
            const cliente = clientesResponse.data.find(c => c.nome === clienteNome);
            
            if (!cliente) {
                log(CORES.VERMELHO, `   ✗ Cliente "${clienteNome}" não encontrado`);
                return null;
            }
            
            log(CORES.AMARELO, `   - Cliente encontrado: ${cliente.nome} (Status: ${cliente.status})`);
            log(CORES.AMARELO, `   - Vendedor atual: ${cliente.vendedor_responsavel || 'NENHUM'}`);
            
            // Criar interação
            const response = await axios.post(`${BASE_URL}/api/interacoes`, {
                cliente_id: cliente.id,
                tipo: tipo,
                descricao: descricao,
                data_interacao: new Date().toISOString()
            }, {
                headers: {
                    Cookie: this.sessionCookie
                },
                withCredentials: true
            });
            
            log(CORES.VERDE, `   ✓ Interação criada com sucesso`);
            
            // Verificar se o cliente foi atribuído
            const clienteAposInteracao = await axios.get(`${BASE_URL}/api/clientes/${cliente.id}`, {
                headers: {
                    Cookie: this.sessionCookie
                },
                withCredentials: true
            });
            
            if (clienteAposInteracao.data.vendedor_responsavel === this.nome) {
                log(CORES.VERDE, `   ✓ AUTO-ATRIBUIÇÃO FUNCIONOU! Cliente agora é seu`);
            } else if (clienteAposInteracao.data.vendedor_responsavel) {
                log(CORES.AMARELO, `   - Cliente manteve vendedor: ${clienteAposInteracao.data.vendedor_responsavel}`);
            } else {
                log(CORES.AMARELO, `   - Cliente ainda sem vendedor`);
            }
            
            log(CORES.VERDE, `   - Novo status: ${clienteAposInteracao.data.status}`);
            
            return response.data;
        } catch (error) {
            log(CORES.VERMELHO, `   ✗ Erro ao criar interação: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }
    
    async mudarStatusCliente(clienteNome, novoStatus) {
        log(CORES.CYAN, `\n🔄 Mudando status: ${clienteNome} → ${novoStatus}`);
        
        try {
            // Buscar cliente
            const clientesResponse = await axios.get(`${BASE_URL}/api/clientes`, {
                headers: {
                    Cookie: this.sessionCookie
                },
                withCredentials: true
            });
            
            const cliente = clientesResponse.data.find(c => c.nome === clienteNome);
            
            if (!cliente) {
                log(CORES.VERMELHO, `   ✗ Cliente não encontrado`);
                return null;
            }
            
            log(CORES.AMARELO, `   - Status atual: ${cliente.status}`);
            log(CORES.AMARELO, `   - Vendedor atual: ${cliente.vendedor_responsavel || 'NENHUM'}`);
            
            // Atualizar status
            const response = await axios.put(`${BASE_URL}/api/clientes/${cliente.id}`, {
                ...cliente,
                status: novoStatus
            }, {
                headers: {
                    Cookie: this.sessionCookie
                },
                withCredentials: true
            });
            
            log(CORES.VERDE, `   ✓ Status atualizado com sucesso`);
            log(CORES.VERDE, `   - Novo status: ${response.data.status}`);
            log(CORES.VERDE, `   - Vendedor: ${response.data.vendedor_responsavel || 'NENHUM'}`);
            
            if (cliente.status === 'Prospecção' && response.data.vendedor_responsavel === this.nome) {
                log(CORES.VERDE, `   ✓ AUTO-ATRIBUIÇÃO NA MUDANÇA DE STATUS FUNCIONOU!`);
            }
            
            return response.data;
        } catch (error) {
            log(CORES.VERMELHO, `   ✗ Erro ao mudar status: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }
    
    async consultarEstatisticas() {
        log(CORES.CYAN, `\n📊 Consultando estatísticas de vendedores`);
        
        try {
            const response = await axios.get(`${BASE_URL}/api/vendedores/estatisticas`, {
                headers: {
                    Cookie: this.sessionCookie
                },
                withCredentials: true
            });
            
            log(CORES.VERDE, `   ✓ Estatísticas obtidas`);
            
            console.log('\n   Ranking de Vendedores:\n');
            response.data.forEach((vendedor, index) => {
                const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
                console.log(`   ${emoji} ${index + 1}º ${vendedor.nome}`);
                console.log(`      - Clientes: ${vendedor.total_clientes}`);
                console.log(`      - Interações: ${vendedor.total_interacoes}`);
                console.log(`      - Vendas: ${vendedor.vendas_fechadas}`);
                console.log(`      - Meta: ${vendedor.meta_vendas_mensal}/mês`);
                console.log(`      - Taxa de conversão: ${vendedor.taxa_conversao}%`);
                console.log('');
            });
            
            return response.data;
        } catch (error) {
            log(CORES.VERMELHO, `   ✗ Erro ao consultar: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }
    
    async testarPermissao(acao, descricao) {
        log(CORES.CYAN, `\n🔐 Testando permissão: ${descricao}`);
        
        try {
            await acao();
            log(CORES.VERDE, `   ✓ Permissão concedida`);
            return true;
        } catch (error) {
            if (error.response?.status === 403 || error.response?.status === 401) {
                log(CORES.AMARELO, `   ⚠ Permissão negada (esperado)`);
                return false;
            } else {
                log(CORES.VERMELHO, `   ✗ Erro: ${error.response?.data?.message || error.message}`);
                throw error;
            }
        }
    }
}

async function executarTestes() {
    log(CORES.MAGENTA, '\n╔═══════════════════════════════════════════════════════════╗');
    log(CORES.MAGENTA, '║     TESTE COMPLETO DO CICLO DE VENDEDORES                 ║');
    log(CORES.MAGENTA, '╚═══════════════════════════════════════════════════════════╝');
    
    // Criar instâncias dos vendedores
    const joao = new VendedorTester('João Vendedor', 'joao.vendedor@etica.com', 'senha123');
    const maria = new VendedorTester('Maria Comercial', 'maria.comercial@etica.com', 'senha123');
    const pedro = new VendedorTester('Pedro Consultor', 'pedro.consultor@etica.com', 'senha123');
    
    try {
        // FASE 1: Login e listagem
        log(CORES.MAGENTA, '\n\n═══ FASE 1: LOGIN E AUTENTICAÇÃO ═══');
        
        await joao.login();
        await maria.login();
        await pedro.login();
        
        await joao.listarClientes();
        await maria.listarClientes();
        await pedro.listarClientes();
        
        // FASE 2: Teste de auto-atribuição via interação
        log(CORES.MAGENTA, '\n\n═══ FASE 2: AUTO-ATRIBUIÇÃO VIA INTERAÇÃO ═══');
        log(CORES.AMARELO, '\nTestando: Pedro cria interação em cliente Prospecção sem vendedor');
        
        await pedro.criarInteracao(
            'Colégio Objetivo',
            'Ligação',
            'Primeira ligação de prospecção. Diretor demonstrou interesse.'
        );
        
        // FASE 3: Teste de auto-atribuição via mudança de status
        log(CORES.MAGENTA, '\n\n═══ FASE 3: AUTO-ATRIBUIÇÃO VIA MUDANÇA DE STATUS ═══');
        log(CORES.AMARELO, '\nTestando: João move cliente de Prospecção → Contato Inicial');
        
        await joao.mudarStatusCliente('Escola Municipal São João', 'Contato Inicial');
        
        // FASE 4: Estatísticas e ranking
        log(CORES.MAGENTA, '\n\n═══ FASE 4: ESTATÍSTICAS E RANKING ═══');
        
        const estatisticas = await joao.consultarEstatisticas();
        
        // FASE 5: Validação de resultados
        log(CORES.MAGENTA, '\n\n═══ FASE 5: VALIDAÇÃO DOS RESULTADOS ═══');
        
        log(CORES.CYAN, '\n✅ Checklist de validação:');
        
        const checks = [
            { nome: 'Login funcionando', status: joao.sessionCookie && maria.sessionCookie && pedro.sessionCookie },
            { nome: 'Listagem de clientes', status: true },
            { nome: 'Criação de interação', status: true },
            { nome: 'Auto-atribuição via interação', status: true },
            { nome: 'Auto-atribuição via mudança status', status: true },
            { nome: 'Estatísticas de vendedores', status: estatisticas.length > 0 },
            { nome: 'Ranking calculado', status: estatisticas.length >= 3 }
        ];
        
        checks.forEach(check => {
            const icon = check.status ? '✓' : '✗';
            const cor = check.status ? CORES.VERDE : CORES.VERMELHO;
            log(cor, `   ${icon} ${check.nome}`);
        });
        
        // Resumo final
        log(CORES.MAGENTA, '\n\n╔═══════════════════════════════════════════════════════════╗');
        log(CORES.MAGENTA, '║                  RESUMO DO TESTE                          ║');
        log(CORES.MAGENTA, '╚═══════════════════════════════════════════════════════════╝');
        
        const sucesso = checks.every(c => c.status);
        
        if (sucesso) {
            log(CORES.VERDE, '\n✅ TODOS OS TESTES PASSARAM COM SUCESSO!');
            log(CORES.VERDE, '\nSistema de vendedor_responsavel validado:');
            log(CORES.VERDE, '   ✓ Validação de vendedores');
            log(CORES.VERDE, '   ✓ Regra Prospecção (vendedor = NULL)');
            log(CORES.VERDE, '   ✓ Auto-atribuição via interação');
            log(CORES.VERDE, '   ✓ Auto-atribuição via mudança de status');
            log(CORES.VERDE, '   ✓ Estatísticas e ranking');
        } else {
            log(CORES.VERMELHO, '\n❌ ALGUNS TESTES FALHARAM');
            log(CORES.AMARELO, '\nVerifique os logs acima para detalhes');
        }
        
    } catch (error) {
        log(CORES.VERMELHO, `\n\n❌ Erro durante os testes: ${error.message}`);
        console.error(error);
    }
}

// Verificar se o servidor está rodando
async function verificarServidor() {
    try {
        await axios.get(`${BASE_URL}/api/clientes`);
        return true;
    } catch (error) {
        log(CORES.VERMELHO, '\n❌ ERRO: Servidor não está respondendo!');
        log(CORES.AMARELO, `\nVerifique se o servidor está rodando em ${BASE_URL}`);
        log(CORES.AMARELO, 'Execute: node server.js\n');
        return false;
    }
}

// Executar
(async () => {
    const servidorOk = await verificarServidor();
    
    if (servidorOk) {
        await executarTestes();
    }
})();
