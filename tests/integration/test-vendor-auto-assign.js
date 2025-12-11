const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testVendorAutoAssign() {
  console.log('🧪 TESTE: Auto-atribuição de Vendedor');
  console.log('=' .repeat(60));

  try {
    // PASSO 1: Login como João Vendedor
    console.log('\n📝 PASSO 1: Fazendo login como João Vendedor...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'joao.vendedor@etica.com',
      senha: 'senha123'
    });

    const token = loginResponse.data.token;
    const usuario = loginResponse.data.usuario;
    
    console.log('✅ Login bem-sucedido!');
    console.log('   👤 Usuário:', usuario.nome);
    console.log('   🎯 Perfil:', usuario.perfil);
    console.log('   🔑 ID:', usuario.id);
    console.log('   🔐 Token:', token.substring(0, 30) + '...');

    // Decodifica o token para ver o payload
    const tokenParts = token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('   📦 Payload do JWT:', JSON.stringify(payload, null, 2));

    // PASSO 2: Buscar um cliente sem vendedor
    console.log('\n📝 PASSO 2: Buscando clientes sem vendedor...');
    const clientesResponse = await axios.get(`${BASE_URL}/api/clientes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const clientesSemVendedor = clientesResponse.data.filter(c => !c.vendedor_responsavel);
    
    if (clientesSemVendedor.length === 0) {
      console.log('⚠️  Nenhum cliente sem vendedor encontrado. Criando um...');
      
      // Criar cliente de teste
      const novoCliente = await axios.post(`${BASE_URL}/api/clientes`, {
        nome: 'Teste Auto-Assign ' + Date.now(),
        tipo: 'PJ',
        cnpj: '12345678000199',
        status: 'prospeccao'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      clientesSemVendedor.push(novoCliente.data);
      console.log('✅ Cliente de teste criado:', novoCliente.data.nome);
    }

    const clienteTeste = clientesSemVendedor[0];
    console.log('✅ Cliente selecionado:', clienteTeste.nome, '(ID:', clienteTeste.id + ')');
    console.log('   Vendedor atual:', clienteTeste.vendedor_responsavel || 'Nenhum');

    // PASSO 3: Marcar uma tarefa (deve auto-atribuir o vendedor)
    console.log('\n📝 PASSO 3: Marcando tarefa na esteira...');
    
    const tarefasAtualizadas = {
      prospeccao: [0], // Marca a primeira tarefa de prospecção
      aumentar_conexao: [],
      apresentar_projeto: [],
      separacao: [],
      documentarios: [],
      envio_consultor: [],
      formacao: [],
      recebimentos: [],
      efetivacao: [],
      renovacao: [],
      entrega: [],
      gerar_graficos: [],
      registros_legais: []
    };

    console.log('   📦 Enviando tarefas:', JSON.stringify(tarefasAtualizadas, null, 2));

    const updateResponse = await axios.put(
      `${BASE_URL}/api/clientes/${clienteTeste.id}/tarefas`,
      { tarefas_concluidas: tarefasAtualizadas },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Tarefas atualizadas com sucesso!');
    console.log('   📊 Resposta do servidor:');
    console.log('   - Status:', updateResponse.data.status);
    console.log('   - Vendedor:', updateResponse.data.vendedor_responsavel || 'ERRO: Não atribuído!');
    console.log('   - Vendedor ID:', updateResponse.data.vendedor_responsavel_id || 'N/A');

    // PASSO 4: Verificar se o vendedor foi atribuído
    console.log('\n📝 PASSO 4: Verificando atribuição...');
    
    const clienteAtualizado = await axios.get(
      `${BASE_URL}/api/clientes/${clienteTeste.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Cliente consultado novamente:');
    console.log('   - Nome:', clienteAtualizado.data.nome);
    console.log('   - Vendedor:', clienteAtualizado.data.vendedor_responsavel || '❌ NÃO ATRIBUÍDO!');
    console.log('   - Vendedor ID:', clienteAtualizado.data.vendedor_responsavel_id || 'N/A');

    // RESULTADO FINAL
    console.log('\n' + '='.repeat(60));
    if (clienteAtualizado.data.vendedor_responsavel === usuario.nome) {
      console.log('✅✅✅ TESTE PASSOU! Vendedor auto-atribuído com sucesso!');
      console.log(`   ${clienteTeste.nome} → ${usuario.nome}`);
    } else {
      console.log('❌❌❌ TESTE FALHOU! Vendedor NÃO foi atribuído!');
      console.log('   Esperado:', usuario.nome);
      console.log('   Obtido:', clienteAtualizado.data.vendedor_responsavel || 'null');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    } else {
      console.error('   Mensagem:', error.message);
    }
    console.error('   Stack:', error.stack);
  }
}

// Executar o teste
testVendorAutoAssign().catch(console.error);
