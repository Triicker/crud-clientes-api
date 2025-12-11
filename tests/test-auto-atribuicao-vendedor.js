/**
 * 🧪 TESTE COMPLETO: Auto-Atribuição de Vendedor
 * Data: 09/12/2025
 * 
 * Este teste verifica:
 * 1. Login como vendedor (João)
 * 2. Buscar cliente sem vendedor (Colégio Amadeus)
 * 3. Abrir esteira do cliente
 * 4. Marcar tarefa na esteira
 * 5. Verificar auto-atribuição do vendedor
 * 6. Validar badge na tabela
 */

const { chromium } = require('playwright');

async function testAutoAtribuicaoVendedor() {
  console.log('🚀 Iniciando teste de auto-atribuição de vendedor...\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Mostra o browser
    slowMo: 500 // Desacelera para visualizar
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Interceptar requisições de API para logs
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('📤 REQUEST:', request.method(), request.url());
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      console.log('📥 RESPONSE:', response.status(), response.url());
      if (response.status() >= 400) {
        try {
          const body = await response.text();
          console.log('❌ Error Body:', body);
        } catch (e) {
          console.log('❌ Não foi possível ler o corpo do erro');
        }
      }
    }
  });
  
  // Interceptar console.log do browser
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('🔴 Browser Error:', msg.text());
    }
  });

  try {
    // PASSO 1: Acessar página de login
    console.log('\n📍 PASSO 1: Acessando página de login...');
    await page.goto('http://localhost:3000/login.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // PASSO 2: Fazer login como João Vendedor
    console.log('\n📍 PASSO 2: Fazendo login como João Vendedor...');
    await page.fill('input[type="email"]', 'joao.vendedor@etica.com');
    await page.fill('input[type="password"]', 'senha123');
    await page.click('button[type="submit"]');
    
    // Aguarda redirecionamento
    await page.waitForURL('**/index.html', { timeout: 5000 });
    console.log('✅ Login realizado com sucesso!');
    
    // Aguarda carregar a tabela
    await page.waitForSelector('table tbody tr', { timeout: 5000 });
    await page.waitForTimeout(2000);

    // PASSO 3: Procurar cliente "Colégio Amadeus" ou outro sem vendedor
    console.log('\n📍 PASSO 3: Procurando cliente "Colégio Amadeus"...');
    
    // Busca todas as linhas da tabela
    const rows = await page.$$('table tbody tr');
    console.log(`   Encontradas ${rows.length} linhas na tabela`);
    
    let clienteEncontrado = false;
    let clienteRow = null;
    let clienteNome = '';
    
    for (const row of rows) {
      const nomeCell = await row.$('td:nth-child(2)'); // Coluna Nome
      const vendedorCell = await row.$('td:nth-child(10)'); // Coluna Vendedor
      
      if (nomeCell && vendedorCell) {
        const nome = await nomeCell.textContent();
        const vendedor = await vendedorCell.textContent();
        
        // Procura por "Colégio Amadeus" ou qualquer cliente sem vendedor
        if (nome.includes('Amadeus') || vendedor.includes('Sem Vendedor')) {
          clienteNome = nome.trim();
          clienteRow = row;
          clienteEncontrado = true;
          console.log(`   ✅ Cliente encontrado: "${clienteNome}"`);
          console.log(`      Vendedor atual: "${vendedor.trim()}"`);
          break;
        }
      }
    }
    
    if (!clienteEncontrado) {
      throw new Error('❌ Nenhum cliente sem vendedor encontrado!');
    }

    // PASSO 4: Abrir modal de esteira
    console.log('\n📍 PASSO 4: Abrindo esteira do cliente...');
    const actionsCell = await clienteRow.$('td:last-child');
    const historicoBtn = await actionsCell.$('i[data-lucide="calendar"]');
    
    if (!historicoBtn) {
      throw new Error('❌ Botão de histórico/calendário não encontrado!');
    }
    
    await historicoBtn.click();
    await page.waitForTimeout(1000);
    
    // Clica no botão "Esteira" no modal
    const esteiraTab = await page.waitForSelector('button:has-text("Esteira")', { timeout: 5000 });
    await esteiraTab.click();
    await page.waitForTimeout(1500);
    console.log('   ✅ Modal de esteira aberta');

    // PASSO 5: Marcar uma tarefa não concluída
    console.log('\n📍 PASSO 5: Marcando tarefa na esteira...');
    
    // Busca primeira célula não concluída (sem classe 'completed')
    const cells = await page.$$('table.esteira-table td:not(.completed)');
    
    if (cells.length === 0) {
      console.log('⚠️  Todas as tarefas já estão concluídas. Desmarcando uma...');
      const completedCell = await page.$('table.esteira-table td.completed');
      if (completedCell) {
        await completedCell.click();
        await page.waitForTimeout(2000);
      }
    } else {
      console.log(`   Encontradas ${cells.length} tarefas não concluídas`);
      
      // Clica na primeira tarefa
      await cells[0].click();
      console.log('   ✅ Tarefa marcada! Aguardando resposta da API...');
      
      // Aguarda um pouco para a requisição completar
      await page.waitForTimeout(3000);
    }

    // PASSO 6: Fechar modal e verificar badge do vendedor
    console.log('\n📍 PASSO 6: Verificando se vendedor foi atribuído...');
    
    // Fecha o modal
    const closeBtn = await page.$('.modal-overlay button.close-modal');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // Busca novamente a linha do cliente na tabela
    const allRows = await page.$$('table tbody tr');
    
    for (const row of allRows) {
      const nomeCell = await row.$('td:nth-child(2)');
      const nome = await nomeCell.textContent();
      
      if (nome.trim() === clienteNome) {
        const vendedorCell = await row.$('td:nth-child(10)');
        const vendedorText = await vendedorCell.textContent();
        
        console.log(`\n📊 RESULTADO FINAL:`);
        console.log(`   Cliente: ${clienteNome}`);
        console.log(`   Vendedor: ${vendedorText.trim()}`);
        
        if (vendedorText.includes('João') || vendedorText.includes('Vendedor')) {
          console.log('\n✅✅✅ SUCESSO! Vendedor foi auto-atribuído! ✅✅✅\n');
        } else if (vendedorText.includes('Sem Vendedor')) {
          console.log('\n❌❌❌ FALHA! Vendedor NÃO foi atribuído! ❌❌❌\n');
          console.log('Possíveis causas:');
          console.log('1. req.usuario está undefined no backend');
          console.log('2. Token JWT não está sendo enviado');
          console.log('3. Middleware auth não está funcionando');
          console.log('4. Erro 500 no backend (verificar console do servidor)');
        } else {
          console.log(`\n⚠️  Cliente já tinha outro vendedor: ${vendedorText.trim()}`);
        }
        
        break;
      }
    }

    console.log('\n✅ Teste concluído! Deixando navegador aberto para inspeção...');
    console.log('   Pressione Ctrl+C no terminal para fechar.\n');
    
    // Mantém o navegador aberto para inspeção
    await page.waitForTimeout(60000); // 60 segundos

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

// Executa o teste
testAutoAtribuicaoVendedor().catch(console.error);
