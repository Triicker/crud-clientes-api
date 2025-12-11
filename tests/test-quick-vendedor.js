/**
 * 🧪 Teste Rápido: Login + Marcar Tarefa
 * Verifica se o token JWT contém os campos necessários
 * e testa o endpoint de atualização de tarefas
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testeRapido() {
  console.log('🧪 TESTE RÁPIDO: Auto-Atribuição de Vendedor\n');
  
  try {
    // PASSO 1: Login
    console.log('1️⃣ Fazendo login como João Vendedor...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'joao.vendedor@etica.com',
      senha: 'senha123'
    });
    
    const { token, usuario } = loginResponse.data;
    console.log('✅ Login bem-sucedido!');
    console.log('   Token:', token.substring(0, 50) + '...');
    console.log('   Usuário:', usuario.nome, '(ID:', usuario.id, ')');
    console.log('   Perfil ID:', usuario.perfil_id);
    console.log('   Perfil Nome:', usuario.perfil_nome);
    
    // Decodifica o JWT (parte do payload)
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
    console.log('\n📦 Payload do JWT:');
    console.log('   id:', payload.id);
    console.log('   nome:', payload.nome);
    console.log('   email:', payload.email);
    console.log('   perfil_id:', payload.perfil_id);
    console.log('   perfil:', payload.perfil);
    
    if (!payload.perfil_id) {
      console.error('\n❌ PROBLEMA: JWT não contém perfil_id!');
      console.error('   O backend não conseguirá verificar se o usuário é vendedor.');
      return;
    }
    
    if (!payload.nome) {
      console.error('\n❌ PROBLEMA: JWT não contém nome!');
      console.error('   O backend não conseguirá atribuir o nome do vendedor.');
      return;
    }
    
    console.log('\n✅ JWT contém todos os campos necessários!\n');

    // PASSO 2: Buscar um cliente sem vendedor
    console.log('2️⃣ Buscando cliente sem vendedor...');
    const clientesResponse = await axios.get(`${BASE_URL}/api/clientes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const clienteSemVendedor = clientesResponse.data.find(c => !c.vendedor_responsavel);
    
    if (!clienteSemVendedor) {
      console.log('⚠️  Nenhum cliente sem vendedor encontrado.');
      console.log('   Criando cenário de teste: zerando vendedor do primeiro cliente...');
      
      const primeiroCliente = clientesResponse.data[0];
      await axios.put(`${BASE_URL}/api/clientes/${primeiroCliente.id}`, {
        ...primeiroCliente,
        vendedor_responsavel: null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`   ✅ Cliente "${primeiroCliente.nome}" agora está sem vendedor`);
    }
    
    const cliente = clienteSemVendedor || clientesResponse.data[0];
    console.log(`   Cliente selecionado: "${cliente.nome}" (ID: ${cliente.id})`);
    console.log(`   Vendedor atual: ${cliente.vendedor_responsavel || 'Nenhum'}`);

    // PASSO 3: Marcar uma tarefa
    console.log('\n3️⃣ Marcando tarefa na esteira...');
    
    const tarefasAtualizadas = {
      prospeccao: [0], // Marca primeira tarefa de prospecção
      aumentar_conexao: [],
      documentarios: [],
      envio_consultor: [],
      formacao: [],
      efetivacao: [],
      separacao: [],
      recebimentos: [],
      renovacao: [],
      entrega: [],
      gerar_graficos: []
    };
    
    console.log('   Enviando PUT /api/clientes/' + cliente.id + '/tarefas');
    console.log('   Com Authorization: Bearer ' + token.substring(0, 30) + '...');
    
    const tarefasResponse = await axios.put(
      `${BASE_URL}/api/clientes/${cliente.id}/tarefas`,
      { tarefas_concluidas: tarefasAtualizadas },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('\n✅ Requisição bem-sucedida! Status:', tarefasResponse.status);
    console.log('\n📊 RESPOSTA DO SERVIDOR:');
    console.log('   Cliente:', tarefasResponse.data.nome);
    console.log('   Status:', tarefasResponse.data.status);
    console.log('   Vendedor Responsável:', tarefasResponse.data.vendedor_responsavel || 'NENHUM');
    
    if (tarefasResponse.data.vendedor_responsavel) {
      console.log('\n✅✅✅ SUCESSO! Vendedor foi auto-atribuído! ✅✅✅');
      console.log(`   "${tarefasResponse.data.vendedor_responsavel}" agora é responsável por "${tarefasResponse.data.nome}"`);
    } else {
      console.log('\n❌❌❌ FALHA! Vendedor NÃO foi atribuído! ❌❌❌');
      console.log('   Verifique os logs do servidor para mais detalhes.');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Dados:', error.response.data);
    }
    
    console.error('\n   Stack:', error.stack);
  }
}

// Executa o teste
testeRapido().catch(console.error);
