const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Escutar todos os console logs da página
  page.on('console', msg => console.log('🌐 Browser:', msg.text()));
  
  // Escutar erros da página
  page.on('pageerror', error => console.error('❌ Page Error:', error.message));

  console.log('🚀 Iniciando teste direto de API...');

  try {
    // 1. LOGIN
    console.log('📝 Etapa 1: Fazendo login...');
    await page.goto('http://localhost:3000/login.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.fill('input[type="email"]', 'novo@admin.com');
    await page.fill('input[type="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    console.log('✅ Login realizado com sucesso!');

    // 2. VERIFICAR CLIENTES EXISTENTES
    console.log('\n📝 Etapa 2: Verificando clientes existentes...');
    await page.waitForSelector('table tbody tr', { timeout: 5000 });
    const clientesAntesCount = await page.locator('table tbody tr').count();
    console.log(`📊 Clientes antes do teste: ${clientesAntesCount}`);

    // 3. CRIAR UM CLIENTE DE TESTE VIA API
    console.log('\n📝 Etapa 3: Tentando adicionar cliente via API...');
    
    const clienteTeste = {
      nome: 'Escola Municipal Teste Playwright',
      tipo: 'Escola Pública Municipal',
      cnpj: '12345678000199', // CNPJ fixo para teste
      cidade: 'Salvador',
      uf: 'BA',
      telefone: '(71) 3333-4444',
      observacoes: 'Cliente de teste criado pelo Playwright'
    };

    // Fazer chamada de API usando page.evaluate para usar o fetch do browser
    const resultado = await page.evaluate(async (cliente) => {
      try {
        const response = await fetch('/api/clientes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cliente)
        });

        const data = await response.json();
        
        return {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          data: data
        };
      } catch (error) {
        return {
          status: 0,
          error: error.message
        };
      }
    }, clienteTeste);

    console.log(`📡 Resposta da API:`, resultado);

    if (resultado.status === 201 || resultado.status === 200) {
      console.log('✅ Cliente adicionado com sucesso!');
    } else if (resultado.status === 409) {
      console.log('⚠️ Cliente já existe (409 Conflict) - isso é esperado!');
      console.log('   Mensagem:', resultado.data.erro);
    } else if (resultado.status === 401 || resultado.status === 403) {
      console.log('❌ Erro de autenticação! Verifique se o token JWT está válido.');
      throw new Error('Erro de autenticação');
    } else {
      console.log('⚠️ Status inesperado:', resultado.status);
      console.log('   Resposta:', resultado.data);
    }

    // 4. RECARREGAR E VERIFICAR SE CLIENTE APARECE NA LISTA
    console.log('\n📝 Etapa 4: Recarregando lista de clientes...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const clientesDepoisCount = await page.locator('table tbody tr').count();
    console.log(`📊 Clientes depois do teste: ${clientesDepoisCount}`);

    // 5. PROCURAR O CLIENTE NA LISTA
    console.log('\n📝 Etapa 5: Procurando cliente na lista...');
    
    const clienteNaLista = await page.locator(`table tbody tr:has-text("${clienteTeste.cnpj}")`).count();
    const clientePorNome = await page.locator(`table tbody tr:has-text("${clienteTeste.nome}")`).count();

    console.log(`🔍 Busca por CNPJ "${clienteTeste.cnpj}": ${clienteNaLista} resultado(s)`);
    console.log(`🔍 Busca por nome "${clienteTeste.nome}": ${clientePorNome} resultado(s)`);

    // 6. RESULTADO FINAL
    console.log('\n' + '='.repeat(80));
    
    let testePassed = false;
    
    if (resultado.status === 409) {
      // Cliente já existe - verificar se está na lista
      if (clienteNaLista > 0 || clientePorNome > 0) {
        testePassed = true;
        console.log('✅ TESTE PASSOU!');
        console.log('   O cliente já estava cadastrado (409) e está visível na lista.');
        console.log('   Isso significa que o sistema está tratando duplicatas corretamente!');
      } else {
        console.log('⚠️ AVISO: Cliente deveria estar cadastrado mas não foi encontrado na lista.');
        console.log('   Isso pode indicar um problema na busca ou na exibição.');
      }
    } else if (resultado.status === 201 || resultado.status === 200) {
      // Cliente foi criado - verificar se está na lista
      if (clienteNaLista > 0 || clientePorNome > 0) {
        testePassed = true;
        console.log('✅ TESTE PASSOU!');
        console.log('   Cliente adicionado com sucesso e está visível na lista!');
      } else {
        console.log('❌ TESTE FALHOU!');
        console.log('   Cliente foi criado mas não aparece na lista.');
      }
    } else {
      console.log('❌ TESTE FALHOU!');
      console.log('   Status inesperado da API:', resultado.status);
    }

    console.log('='.repeat(80) + '\n');

    // Tirar screenshot final
    await page.screenshot({ path: 'teste-resultado-final.png', fullPage: true });
    console.log('📸 Screenshot salvo: teste-resultado-final.png');

    // Aguardar para visualização
    console.log('⏳ Aguardando 5 segundos antes de finalizar...');
    await page.waitForTimeout(5000);

    if (!testePassed) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error('Stack:', error.stack);
    await page.screenshot({ path: 'teste-erro.png', fullPage: true });
    console.log('📸 Screenshot do erro salvo: teste-erro.png');
    process.exit(1);
  } finally {
    await browser.close();
    console.log('🏁 Teste finalizado!');
  }
})();
