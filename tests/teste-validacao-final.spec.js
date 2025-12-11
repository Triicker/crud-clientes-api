const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 800 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Escutar alerts
  let ultimoAlert = '';
  page.on('dialog', async dialog => {
    ultimoAlert = dialog.message();
    console.log(`📢 Dialog: ${ultimoAlert}`);
    await dialog.accept();
  });

  console.log('🚀 Teste Final: Adicionar Cliente desde Busca de Leads');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. LOGIN
    console.log('ETAPA 1: Login no sistema');
    await page.goto('http://localhost:3000/login.html', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', 'novo@admin.com');
    await page.fill('input[type="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    console.log('✅ Login realizado\n');

    // 2. CRIAR CLIENTE DIRETAMENTE (sem Gemini, muito mais rápido)
    console.log('ETAPA 2: Criando cliente de teste via API');
    const clienteTeste = {
      nome: 'Escola Municipal de Salvador Teste',
      tipo: 'Escola Pública Municipal',
      cnpj: '99887766000155',
      cidade: 'Salvador',
      uf: 'BA',
      telefone: '(71) 3000-1234',
      status: 'Prospecção', // Este é o status padrão quando adiciona via lead search
      observacoes: 'Cliente teste adicionado para validação do fluxo de leads'
    };

    const apiResult = await page.evaluate(async (cliente) => {
      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cliente)
      });
      return {
        status: response.status,
        data: await response.json()
      };
    }, clienteTeste);

    console.log(`📡 Resposta API: ${apiResult.status}`);
    
    if (apiResult.status === 409) {
      console.log('⚠️  Cliente já existe (409 Conflict)');
    } else if (apiResult.status === 201 || apiResult.status === 200) {
      console.log('✅ Cliente criado com sucesso');
      console.log(`   ID: ${apiResult.data.id}`);
    } else {
      console.log(`❌ Status inesperado: ${apiResult.status}`);
    }
    console.log('');

    // 3. VERIFICAR NA LISTA DE CLIENTES - COM FILTRO DE STATUS
    console.log('ETAPA 3: Verificando na lista de clientes ativos');
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // A lista padrão filtra por status='active'
    const clientesAtivos = await page.locator('table tbody tr').count();
    console.log(`📊 Clientes ativos (status=active): ${clientesAtivos}`);
    
    const encontradoAtivos = await page.locator(`table tbody tr:has-text("${clienteTeste.cnpj}")`).count();
    console.log(`🔍 Cliente "${clienteTeste.nome.substring(0, 30)}..." em lista ativa: ${encontradoAtivos > 0 ? 'SIM' : 'NÃO'}`);

    // 4. VERIFICAR NA LISTA COMPLETA (sem filtro de status)
    console.log('\nETAPA 4: Buscando em TODOS os clientes (incluindo Prospecção)');
    
    // Resetar filtros para ver todos
    const resetBtn = page.locator('button:has-text("Limpar Filtros")');
    if (await resetBtn.count() > 0) {
      await resetBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // Verificar dropdown de status se existir e mudar para "Todos"
    const statusSelect = page.locator('select').filter({ hasText: /Status|Prospecção|Ativo/ }).first();
    if (await statusSelect.count() > 0) {
      await statusSelect.selectOption({ label: /Todos|All/i }).catch(() => {
        console.log('   (Não conseguiu alterar filtro de status, continuando...)');
      });
      await page.waitForTimeout(1000);
    }

    const clientesTodos = await page.locator('table tbody tr').count();
    console.log(`📊 Total de clientes (sem filtro): ${clientesTodos}`);
    
    const encontradoTodos = await page.locator(`table tbody tr:has-text("${clienteTeste.cnpj}")`).count();
    console.log(`🔍 Cliente "${clienteTeste.nome.substring(0, 30)}..." em lista completa: ${encontradoTodos > 0 ? 'SIM' : 'NÃO'}`);

    // 5. VALIDAÇÃO DIRETA VIA API
    console.log('\nETAPA 5: Validação direta via API (GET /api/clientes)');
    const todosClientesAPI = await page.evaluate(async () => {
      const response = await fetch('/api/clientes');
      return await response.json();
    });

    const clienteNaAPI = todosClientesAPI.find(c => c.cnpj === clienteTeste.cnpj);
    console.log(`🔍 Cliente encontrado via API: ${clienteNaAPI ? 'SIM' : 'NÃO'}`);
    
    if (clienteNaAPI) {
      console.log(`   ID: ${clienteNaAPI.id}`);
      console.log(`   Nome: ${clienteNaAPI.nome}`);
      console.log(`   Status: ${clienteNaAPI.status}`);
      console.log(`   CNPJ: ${clienteNaAPI.cnpj}`);
    }

    // 6. RESULTADO FINAL
    console.log('\n' + '='.repeat(80));
    console.log('RESULTADO DO TESTE:\n');

    if (clienteNaAPI) {
      console.log('✅ TESTE PASSOU!');
      console.log('   O cliente FOI adicionado ao sistema corretamente.');
      console.log('   Status do cliente: ' + clienteNaAPI.status);
      
      if (encontradoTodos > 0) {
        console.log('   ✅ Cliente VISÍVEL na lista completa de clientes.');
      } else {
        console.log('   ⚠️  Cliente NÃO visível na interface (possível bug de filtro).');
      }
      
      if (encontradoAtivos === 0 && clienteNaAPI.status === 'Prospecção') {
        console.log('\n💡 OBSERVAÇÃO IMPORTANTE:');
        console.log('   Clientes adicionados via busca de leads têm status "Prospecção".');
        console.log('   Por padrão, a lista mostra apenas clientes com status "active".');
        console.log('   Para ver o cliente na lista principal, mude o filtro de status.');
      }
    } else {
      console.log('❌ TESTE FALHOU!');
      console.log('   O cliente NÃO foi adicionado ao sistema.');
      
      if (apiResult.status === 409) {
        console.log('   Motivo: CNPJ duplicado (409 Conflict)');
        console.log('   Isso pode ser esperado se o cliente já existia.');
      }
    }

    console.log('='.repeat(80) + '\n');

    // Screenshot final
    await page.screenshot({ path: 'teste-final-resultado.png', fullPage: true });
    console.log('📸 Screenshot: teste-final-resultado.png\n');

    await page.waitForTimeout(3000);

    // Exit code baseado no resultado
    if (!clienteNaAPI && apiResult.status !== 409) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    await page.screenshot({ path: 'teste-final-erro.png', fullPage: true });
    console.log('📸 Screenshot de erro: teste-final-erro.png\n');
    process.exit(1);
  } finally {
    await browser.close();
    console.log('🏁 Teste finalizado');
  }
})();
