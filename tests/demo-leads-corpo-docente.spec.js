const { test } = require('@playwright/test');
const path = require('path');

const screenshotDir = path.join(__dirname, '..', '.playwright-mcp', 'documentation', 'screenshots');

test('Demonstração Real: Busca Leads com Corpo Docente', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login.html');
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Acessar Gemini Search
  await page.goto('http://localhost:3000/gemini-search/');
  await page.waitForTimeout(3000);
  
  // Inserir API Key
  await page.fill('input[type="password"]', 'AIzaSyCMflWEGSHjKyd-VqWy_x1ztrbX06wZ_gs');
  await page.click('button:has-text("Confirmar")');
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: path.join(screenshotDir, '20-configuracao-gemini-leads.png'),
    fullPage: true
  });

  // Selecionar modo Leads
  await page.click('label:has-text("Leads")');
  await page.waitForTimeout(1000);

  // Selecionar Bahia
  await page.selectOption('select:has(option:has-text("Bahia"))', { label: 'Bahia' });
  await page.waitForTimeout(2000); // Aguarda carregamento das cidades

  // Selecionar Salvador
  await page.selectOption('select:has(option:has-text("Salvador"))', { label: 'Salvador' });
  await page.waitForTimeout(1000);

  // Selecionar Escola Pública Estadual
  await page.selectOption('select:has(option:has-text("Escola Pública Estadual"))', { label: 'Escola Pública Estadual' });
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: path.join(screenshotDir, '21-parametros-busca-leads.png'),
    fullPage: true
  });

  // Executar busca
  await page.click('button:has-text("Buscar Contatos")');
  await page.waitForTimeout(15000); // Aguarda IA processar com corpo docente

  await page.screenshot({
    path: path.join(screenshotDir, '22-resultados-leads-com-corpo-docente.png'),
    fullPage: true
  });

  // Tentar scrollar para ver mais resultados
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(screenshotDir, '23-resultados-leads-completos.png'),
    fullPage: true
  });

  // Voltar para o topo
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  // Exportar dados se disponível
  const exportButton = await page.locator('button:has-text("Exportar"), button:has-text("CSV"), button:has-text("Download")');
  if (await exportButton.count() > 0) {
    await exportButton.first().click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(screenshotDir, '24-exportacao-leads.png'),
      fullPage: true
    });
  }

  console.log('Demonstração de busca de leads com corpo docente concluída!');
});