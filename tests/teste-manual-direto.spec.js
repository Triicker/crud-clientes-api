const { test } = require('@playwright/test');
const path = require('path');

const screenshotDir = path.join(__dirname, '..', '.playwright-mcp', 'documentation', 'screenshots');

test('Teste Manual Direto - Escola Municipal Salvador', async ({ page }) => {
  console.log('🔄 Teste manual direto...');
  
  // Login
  await page.goto('http://localhost:3000/login.html');
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Dashboard principal para verificar se está funcionando
  await page.goto('http://localhost:3000/index.html');
  await page.waitForTimeout(2000);
  
  await page.screenshot({
    path: path.join(screenshotDir, 'manual-01-dashboard.png'),
    fullPage: true
  });

  console.log('✅ Dashboard funcionando');

  // Gemini Search
  await page.goto('http://localhost:3000/gemini-search/');
  await page.waitForTimeout(5000);
  
  await page.screenshot({
    path: path.join(screenshotDir, 'manual-02-gemini-inicial.png'),
    fullPage: true
  });

  // Verificar elementos disponíveis
  const inputs = await page.locator('input').count();
  const selects = await page.locator('select').count();
  const buttons = await page.locator('button').count();
  
  console.log(`📋 Elementos encontrados: ${inputs} inputs, ${selects} selects, ${buttons} buttons`);

  // Tentar inserir API key se estiver visível
  try {
    const apiInput = await page.locator('input[type="password"]');
    if (await apiInput.isVisible()) {
      await apiInput.fill('AIzaSyCMflWEGSHjKyd-VqWy_x1ztrbX06wZ_gs');
      console.log('✅ API Key inserida');
      
      await page.screenshot({
        path: path.join(screenshotDir, 'manual-03-api-inserida.png'),
        fullPage: true
      });
    }
  } catch (e) {
    console.log('❌ Erro ao inserir API key:', e.message);
  }

  // Tentar clicar no botão de confirmar se existir
  try {
    const submitButton = await page.locator('button:has-text("Confirmar"), button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Botão confirmar clicado');
    }
  } catch (e) {
    console.log('❌ Erro ao confirmar:', e.message);
  }

  await page.screenshot({
    path: path.join(screenshotDir, 'manual-04-pos-confirmacao.png'),
    fullPage: true
  });

  // Verificar se há opção de leads
  try {
    const leadsRadio = await page.locator('input[value="leads"]');
    if (await leadsRadio.isVisible()) {
      await leadsRadio.click();
      await page.waitForTimeout(1000);
      console.log('✅ Modo leads selecionado');
      
      await page.screenshot({
        path: path.join(screenshotDir, 'manual-05-modo-leads.png'),
        fullPage: true
      });
    }
  } catch (e) {
    console.log('❌ Erro ao selecionar leads:', e.message);
  }

  // Aguardar um pouco mais e verificar quantos selects existem agora
  await page.waitForTimeout(3000);
  const selectsAfter = await page.locator('select').count();
  console.log(`📋 Selects após configuração: ${selectsAfter}`);

  if (selectsAfter > 0) {
    // Listar opções do primeiro select
    const firstSelect = await page.locator('select').first();
    const options = await firstSelect.locator('option').count();
    console.log(`📋 Primeiro select tem ${options} opções`);
    
    if (options > 1) {
      // Tentar selecionar Bahia
      try {
        await firstSelect.selectOption({ label: 'Bahia' });
        console.log('✅ Bahia selecionada');
        await page.waitForTimeout(3000); // Aguarda carregar cidades
        
        await page.screenshot({
          path: path.join(screenshotDir, 'manual-06-bahia-selecionada.png'),
          fullPage: true
        });
      } catch (e) {
        console.log('❌ Erro ao selecionar Bahia:', e.message);
      }
    }
  }

  // Verificar estado final
  const finalSelects = await page.locator('select').count();
  console.log(`📋 Selects finais: ${finalSelects}`);

  await page.screenshot({
    path: path.join(screenshotDir, 'manual-07-estado-final.png'),
    fullPage: true
  });

  console.log('✅ Teste manual concluído - verificar screenshots');
});