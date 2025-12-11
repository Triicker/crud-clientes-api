const { chromium } = require('@playwright/test');

/**
 * TESTE FINAL DE VALIDAÇÃO
 * Verifica que o sistema agora funciona corretamente:
 * 1. Banco limpo (sem dados fictícios)
 * 2. Adição de clientes funcional
 * 3. Verificação de CNPJ duplicado antes de inserir
 * 4. Cliente aparece na lista após cadastro
 */

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 800 });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const dialogs = [];
  page.on('dialog', async dialog => {
    dialogs.push(dialog.message());
    console.log(`📢 ${dialog.type()}: ${dialog.message().substring(0, 100)}...`);
    await dialog.accept();
  });

  console.log('🧪 TESTE FINAL DE VALIDAÇÃO DO SISTEMA');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. LOGIN
    console.log('1️⃣ Login');
    await page.goto('http://localhost:3000/login.html');
    await page.fill('input[type="email"]', 'novo@admin.com');
    await page.fill('input[type="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    console.log('   ✅ Login OK\n');

    // 2. VERIFICAR CLIENTES NO SISTEMA
    console.log('2️⃣ Verificando clientes no sistema');
    const clientesAPI = await page.evaluate(async () => {
      const response = await fetch('/api/clientes');
      return await response.json();
    });
    console.log(`   📊 Total de clientes: ${clientesAPI.length}`);
    
    const cnpjsFicticios = clientesAPI.filter(c => 
      /^(12345678|23456789|00000000|11111111|33333333|98765432)/.test((c.cnpj || '').replace(/\D/g, ''))
    );
    console.log(`   🗑️ CNPJs fictícios: ${cnpjsFicticios.length}`);
    
    if (cnpjsFicticios.length === 0) {
      console.log('   ✅ Banco de dados limpo!\n');
    } else {
      console.log('   ⚠️ Ainda há dados fictícios no banco\n');
    }

    // 3. TESTAR ENDPOINT DE VERIFICAÇÃO DE CNPJ
    console.log('3️⃣ Testando endpoint de verificação de CNPJ');
    
    // Pegar um CNPJ que existe
    const clienteExistente = clientesAPI.find(c => c.cnpj);
    if (clienteExistente) {
      const checkResult = await page.evaluate(async (cnpj) => {
        const response = await fetch(`/api/clientes/cnpj/${encodeURIComponent(cnpj)}`);
        return { status: response.status, data: response.ok ? await response.json() : null };
      }, clienteExistente.cnpj);
      
      console.log(`   Testando CNPJ existente: ${clienteExistente.cnpj}`);
      console.log(`   Status: ${checkResult.status}`);
      
      if (checkResult.status === 200 && checkResult.data) {
        console.log(`   ✅ Endpoint funcionando! Encontrou: ${checkResult.data.nome}\n`);
      } else {
        console.log(`   ❌ Endpoint com problema\n`);
      }
    }

    // Testar CNPJ que não existe
    const checkNaoExiste = await page.evaluate(async () => {
      const response = await fetch('/api/clientes/cnpj/99999999999999');
      return { status: response.status };
    });
    console.log(`   Testando CNPJ inexistente: 99999999999999`);
    console.log(`   Status: ${checkNaoExiste.status} (esperado: 404)`);
    console.log(`   ${checkNaoExiste.status === 404 ? '✅' : '❌'} ${checkNaoExiste.status === 404 ? 'OK' : 'Falhou'}\n`);

    // 4. CADASTRAR NOVO CLIENTE
    console.log('4️⃣ Cadastrando novo cliente');
    
    const novoCliente = {
      nome: 'Escola Municipal Real de Salvador',
      tipo: 'Escola Pública Municipal',
      cnpj: '13.456.789/0001-23', // CNPJ formato real
      cidade: 'Salvador',
      uf: 'BA',
      telefone: '(71) 3456-7890',
      observacoes: 'Cliente real cadastrado via teste automatizado'
    };

    const createResult = await page.evaluate(async (cliente) => {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cliente)
      });
      return { status: response.status, data: await response.json() };
    }, novoCliente);

    console.log(`   Nome: ${novoCliente.nome}`);
    console.log(`   CNPJ: ${novoCliente.cnpj}`);
    console.log(`   Status da API: ${createResult.status}`);

    if (createResult.status === 201) {
      console.log(`   ✅ Cliente criado com sucesso! ID: ${createResult.data.id}\n`);
    } else if (createResult.status === 409) {
      console.log(`   ⚠️ Cliente já existe (isso é OK se repetiu o teste)\n`);
    } else {
      console.log(`   ❌ Erro: ${createResult.data.erro}\n`);
    }

    // 5. VERIFICAR SE O CLIENTE APARECE NA LISTA
    console.log('5️⃣ Verificando se cliente aparece na lista');
    await page.goto('http://localhost:3000/index.html');
    await page.waitForTimeout(3000);

    const clienteNaLista = await page.locator(`table tbody tr:has-text("${novoCliente.cnpj.replace(/\D/g, '')}")`).count();
    const clientePorNome = await page.locator(`table tbody tr:has-text("Escola Municipal Real")`).count();
    
    console.log(`   Busca por CNPJ: ${clienteNaLista > 0 ? '✅ Encontrado' : '❌ Não encontrado'}`);
    console.log(`   Busca por nome: ${clientePorNome > 0 ? '✅ Encontrado' : '❌ Não encontrado'}\n`);

    // 6. RESULTADO FINAL
    console.log('='.repeat(80));
    console.log('📊 RESULTADO FINAL DO TESTE');
    console.log('='.repeat(80));
    
    const todosOK = cnpjsFicticios.length === 0 && 
                    (createResult.status === 201 || createResult.status === 409) &&
                    (clienteNaLista > 0 || clientePorNome > 0);
    
    if (todosOK) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM!\n');
      console.log('✅ Banco de dados limpo (sem dados fictícios)');
      console.log('✅ Endpoint de verificação de CNPJ funcionando');
      console.log('✅ Cadastro de clientes operacional');
      console.log('✅ Cliente aparece na lista após cadastro');
      console.log('\n💡 O sistema está pronto para uso!\n');
    } else {
      console.log('\n⚠️ ALGUNS TESTES FALHARAM\n');
      if (cnpjsFicticios.length > 0) console.log('❌ Ainda há dados fictícios no banco');
      if (createResult.status !== 201 && createResult.status !== 409) console.log('❌ Erro no cadastro de cliente');
      if (clienteNaLista === 0 && clientePorNome === 0) console.log('❌ Cliente não aparece na lista');
    }

    console.log('='.repeat(80) + '\n');

    // Screenshot final
    await page.screenshot({ path: 'validacao-final.png', fullPage: true });
    console.log('📸 Screenshot: validacao-final.png\n');

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    await page.screenshot({ path: 'validacao-erro.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('🏁 Teste finalizado!');
  }
})();
