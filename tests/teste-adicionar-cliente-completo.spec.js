const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('🚀 Iniciando teste de adição de cliente...');

  try {
    // 1. LOGIN
    console.log('📝 Etapa 1: Fazendo login...');
    await page.goto('http://localhost:3000/login.html', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'novo@admin.com');
    await page.fill('input[type="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 5000 });
    console.log('✅ Login realizado com sucesso!');

    // 2. NAVEGAR PARA BUSCA DE LEADS
    console.log('📝 Etapa 2: Navegando para busca de leads...');
    await page.goto('http://localhost:3000/gemini-search/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✅ Página de busca carregada!');

    // 3. CONFIGURAR API KEY
    console.log('📝 Etapa 3: Configurando API Key do Gemini...');
    const apiKeyInput = await page.$('input[placeholder*="API Key"]');
    if (apiKeyInput) {
      await apiKeyInput.fill('AIzaSyCMflWEGSHjKyd-VqWy_x1ztrbX06wZ_gs');
      console.log('✅ API Key configurada!');
    }

    // 4. REALIZAR BUSCA DE LEADS
    console.log('📝 Etapa 4: Realizando busca de leads...');
    await page.selectOption('select:has-text("UF")', 'BA');
    await page.waitForTimeout(500);
    await page.selectOption('select:has-text("Cidade")', { label: /Salvador/i });
    await page.waitForTimeout(500);
    await page.selectOption('select:has-text("Tipo")', 'Escola Pública Municipal');
    await page.waitForTimeout(500);
    
    // Clicar no botão de busca
    await page.click('button:has-text("Buscar Leads")');
    console.log('⏳ Aguardando resultados da busca...');
    
    // Aguardar resultados (pode demorar por causa da API do Gemini)
    await page.waitForTimeout(15000); // 15 segundos para Gemini responder
    
    // Verificar se há resultados
    const resultados = await page.locator('table tbody tr').count();
    console.log(`✅ Busca concluída! Encontrados ${resultados} resultados.`);

    if (resultados === 0) {
      throw new Error('Nenhum resultado encontrado na busca de leads!');
    }

    // 5. TENTAR ADICIONAR PRIMEIRO CLIENTE
    console.log('📝 Etapa 5: Tentando adicionar primeiro cliente da lista...');
    
    // Pegar informações do primeiro cliente antes de clicar
    const primeiraLinha = page.locator('table tbody tr').first();
    const nomeCliente = await primeiraLinha.locator('td').first().locator('div.font-bold').textContent();
    const cnpjElement = await primeiraLinha.locator('span.font-mono');
    let cnpjCliente = '';
    if (await cnpjElement.count() > 0) {
      cnpjCliente = await cnpjElement.textContent();
    }
    
    console.log(`📊 Cliente selecionado: ${nomeCliente.trim()}`);
    console.log(`📊 CNPJ: ${cnpjCliente.trim()}`);

    // Clicar no botão "Adicionar"
    const botaoAdicionar = primeiraLinha.locator('button:has-text("Adicionar")');
    await botaoAdicionar.click();
    console.log('🖱️ Botão "Adicionar" clicado!');

    // Aguardar e aceitar o confirm dialog
    page.on('dialog', async dialog => {
      console.log(`📢 Dialog apareceu: ${dialog.message()}`);
      await dialog.accept();
    });

    await page.waitForTimeout(1000);
    
    // Capturar o próximo alert (sucesso ou erro de duplicado)
    let mensagemAlert = '';
    page.once('dialog', async dialog => {
      mensagemAlert = dialog.message();
      console.log(`📢 Alert: ${mensagemAlert}`);
      await dialog.accept();
    });

    await page.waitForTimeout(2000);

    // 6. VERIFICAR SE CLIENTE FOI ADICIONADO OU JÁ EXISTE
    console.log('📝 Etapa 6: Verificando resultado da adição...');
    
    if (mensagemAlert.includes('sucesso')) {
      console.log('✅ Cliente adicionado com sucesso!');
    } else if (mensagemAlert.includes('já está cadastrado') || mensagemAlert.includes('duplicado')) {
      console.log('⚠️ Cliente já estava cadastrado (CNPJ duplicado) - isso é esperado!');
    } else if (mensagemAlert) {
      console.log(`ℹ️ Mensagem recebida: ${mensagemAlert}`);
    }

    // 7. NAVEGAR PARA LISTA DE CLIENTES E VERIFICAR
    console.log('📝 Etapa 7: Navegando para lista de clientes...');
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('✅ Página de clientes carregada!');

    // 8. BUSCAR O CLIENTE NA LISTA
    console.log('📝 Etapa 8: Procurando cliente na lista...');
    
    // Procurar pelo nome ou CNPJ na tabela
    const tabelaClientes = page.locator('table tbody tr');
    const totalClientes = await tabelaClientes.count();
    console.log(`📊 Total de clientes na lista: ${totalClientes}`);

    let clienteEncontrado = false;
    
    // Buscar pelo CNPJ se disponível
    if (cnpjCliente) {
      const cnpjNormalizado = cnpjCliente.trim();
      const linhaComCNPJ = await page.locator(`table tbody tr:has-text("${cnpjNormalizado}")`).count();
      if (linhaComCNPJ > 0) {
        clienteEncontrado = true;
        console.log(`✅ Cliente encontrado na lista pelo CNPJ: ${cnpjNormalizado}`);
      }
    }
    
    // Se não encontrou pelo CNPJ, buscar pelo nome
    if (!clienteEncontrado) {
      const nomeNormalizado = nomeCliente.trim();
      const linhaComNome = await page.locator(`table tbody tr:has-text("${nomeNormalizado}")`).count();
      if (linhaComNome > 0) {
        clienteEncontrado = true;
        console.log(`✅ Cliente encontrado na lista pelo nome: ${nomeNormalizado}`);
      }
    }

    // 9. RESULTADO FINAL
    console.log('\n' + '='.repeat(80));
    if (clienteEncontrado) {
      console.log('🎉 TESTE PASSOU! Cliente está cadastrado no sistema.');
      console.log('✅ O fluxo de adição de cliente a partir da busca de leads está funcionando!');
    } else {
      console.log('❌ TESTE FALHOU! Cliente não encontrado na lista.');
      console.log('⚠️ O cliente pode não ter sido adicionado corretamente.');
      
      // Tirar screenshot para debug
      await page.screenshot({ path: 'teste-falha-cliente-nao-encontrado.png', fullPage: true });
      console.log('📸 Screenshot salvo: teste-falha-cliente-nao-encontrado.png');
    }
    console.log('='.repeat(80) + '\n');

    // Aguardar um pouco antes de fechar para visualização
    console.log('⏳ Aguardando 5 segundos antes de finalizar...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
    await page.screenshot({ path: 'teste-erro.png', fullPage: true });
    console.log('📸 Screenshot do erro salvo: teste-erro.png');
  } finally {
    await browser.close();
    console.log('🏁 Teste finalizado!');
  }
})();
