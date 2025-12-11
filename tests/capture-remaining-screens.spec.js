const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Ensure screenshot directory exists
const screenshotDir = path.join(__dirname, '..', '.playwright-mcp', 'documentation', 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function doLogin(page) {
  await page.goto('http://localhost:3000/login.html');
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

test.describe('Captura de Telas Restantes do Sistema', () => {

  test('04 - Gestão de Vendedores', async ({ page }) => {
    await doLogin(page);
    await page.goto('http://localhost:3000/gestao-vendedores.html');
    await page.waitForTimeout(3000); // Aguarda carregamento dos dados
    
    await page.screenshot({
      path: path.join(screenshotDir, '04-gestao-vendedores.png'),
      fullPage: true
    });
  });

  test('05 - Gestão de Equipe', async ({ page }) => {
    await doLogin(page);
    await page.goto('http://localhost:3000/gestao-equipe.html');
    await page.waitForTimeout(3000);
    
    await page.screenshot({
      path: path.join(screenshotDir, '05-gestao-equipe.png'),
      fullPage: true
    });
  });

  test('06 - Comunicação da Equipe', async ({ page }) => {
    await doLogin(page);
    await page.goto('http://localhost:3000/comunicacao-equipe.html');
    await page.waitForTimeout(3000);
    
    await page.screenshot({
      path: path.join(screenshotDir, '06-comunicacao-equipe.png'),
      fullPage: true
    });
  });

  test('07 - Liberações e Etapas', async ({ page }) => {
    await doLogin(page);
    await page.goto('http://localhost:3000/liberacoes-etapas.html');
    await page.waitForTimeout(3000);
    
    await page.screenshot({
      path: path.join(screenshotDir, '07-liberacoes-etapas.png'),
      fullPage: true
    });
  });

  test('08 - Busca de Contratos', async ({ page }) => {
    await doLogin(page);
    await page.goto('http://localhost:3000/search.html');
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(screenshotDir, '08-busca-contratos.png'),
      fullPage: true
    });
  });

  test('09 - Busca com Gemini AI', async ({ page }) => {
    await doLogin(page);
    await page.goto('http://localhost:3000/gemini-search/');
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(screenshotDir, '09-gemini-search.png'),
      fullPage: true
    });
  });
});
