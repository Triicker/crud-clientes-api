// generate-documentation.spec.js
// Script para gerar documentação automatizada com screenshots do sistema

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Configuração de usuário de teste
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

// Criar diretório para screenshots
const screenshotsDir = path.join(__dirname, '../documentation/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('Documentação do Sistema - Geração de Screenshots', () => {
  // Cada teste criará seu próprio contexto e página

  test('01 - Tela de Login', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    
    await page.goto('/login.html');
    await page.waitForLoadState('networkidle');
    
    // Aguardar elementos carregarem
    await page.waitForSelector('h1');
    
    // Capturar tela de login inicial
    await page.screenshot({
      path: path.join(screenshotsDir, '01-login-inicial.png'),
      fullPage: true
    });

    console.log('✅ Screenshot 01: Tela de Login capturada');
    
    await context.close();
  });

  test('02 - Login - Preenchimento de Credenciais', async () => {
    await page.goto('/login.html');
    await page.waitForLoadState('networkidle');
    
    // Preencher campos
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Capturar com campos preenchidos
    await page.screenshot({
      path: path.join(screenshotsDir, '02-login-preenchido.png'),
      fullPage: true
    });

    console.log('✅ Screenshot 02: Login com credenciais preenchidas');
  });

  test('03 - Dashboard Principal - Visão Geral', async () => {
    // Fazer login
    await page.goto('/login.html');
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento e carregamento
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Aguardar renderização
    
    // Capturar dashboard
    await page.screenshot({
      path: path.join(screenshotsDir, '03-dashboard-principal.png'),
      fullPage: true
    });

    console.log('✅ Screenshot 03: Dashboard Principal capturado');
  });

  test('04 - Dashboard - Header e Informações do Usuário', async () => {
    await page.goto('/login.html');
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Abrir menu do usuário
    const menuButton = await page.locator('button[id="userMenuButton"]').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);
      
      await page.screenshot({
        path: path.join(screenshotsDir, '04-dashboard-menu-usuario.png'),
        fullPage: true
      });

      console.log('✅ Screenshot 04: Menu do usuário capturado');
    }
  });

  test('05 - Dashboard - Barra de Pesquisa', async () => {
    await page.goto('/login.html');
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Focar na barra de pesquisa
    const searchInput = await page.locator('input[id="searchInput"]');
    await searchInput.focus();
    await searchInput.fill('Cliente Teste');
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '05-dashboard-pesquisa.png'),
      fullPage: true
    });

    console.log('✅ Screenshot 05: Barra de pesquisa em uso');
  });

  test('06 - Dashboard - Filtros e Controles', async () => {
    await page.goto('/login.html');
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Rolar para área de filtros
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '06-dashboard-filtros.png'),
      fullPage: true
    });

    console.log('✅ Screenshot 06: Seção de filtros capturada');
  });

  test('07 - Dashboard - Lista de Clientes', async () => {
    await page.goto('/login.html');
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Rolar para tabela de clientes
    await page.evaluate(() => {
      const table = document.querySelector('table');
      if (table) table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '07-dashboard-lista-clientes.png'),
      fullPage: true
    });

    console.log('✅ Screenshot 07: Lista de clientes capturada');
  });

  test('08 - Modal de Adicionar Cliente', async () => {
    await page.goto('/login.html');
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Procurar e clicar no botão de adicionar
    const addButton = await page.locator('button:has-text("Adicionar"), button:has-text("Novo")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({
        path: path.join(screenshotsDir, '08-modal-adicionar-cliente.png'),
        fullPage: true
      });

      console.log('✅ Screenshot 08: Modal de adicionar cliente capturado');
    }
  });

  test('09 - Detalhes do Cliente', async () => {
    await page.goto('/login.html');
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Clicar no primeiro cliente da lista
    const firstClient = await page.locator('table tbody tr').first();
    if (await firstClient.isVisible()) {
      await firstClient.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({
        path: path.join(screenshotsDir, '09-detalhes-cliente.png'),
        fullPage: true
      });

      console.log('✅ Screenshot 09: Tela de detalhes do cliente capturada');
    }
  });

  test('10 - Gestão de Vendedores', async () => {
    await page.goto('/login.html');
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Tentar navegar para gestão de vendedores
    await page.goto('/gestao-vendedores.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '10-gestao-vendedores.png'),
      fullPage: true
    });

    console.log('✅ Screenshot 10: Gestão de vendedores capturada');
  });

  test('11 - Gestão de Equipe', async () => {
    await page.goto('/login.html');
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await page.goto('/gestao-equipe.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '11-gestao-equipe.png'),
      fullPage: true
    });

    console.log('✅ Screenshot 11: Gestão de equipe capturada');
  });

  test('12 - Comunicação da Equipe', async () => {
    await page.goto('/login.html');
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await page.goto('/comunicacao-equipe.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '12-comunicacao-equipe.png'),
      fullPage: true
    });

    console.log('✅ Screenshot 12: Comunicação da equipe capturada');
  });

  test('13 - Liberações e Etapas', async () => {
    await page.goto('/login.html');
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await page.goto('/liberacoes-etapas.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '13-liberacoes-etapas.png'),
      fullPage: true
    });

    console.log('✅ Screenshot 13: Liberações e etapas capturada');
  });

  test('14 - Busca Avançada de Contratos', async () => {
    await page.goto('/login.html');
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await page.goto('/search.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '14-busca-contratos.png'),
      fullPage: true
    });

    console.log('✅ Screenshot 14: Busca de contratos capturada');
  });

  test('15 - Busca com Gemini AI', async () => {
    await page.goto('/login.html');
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/index.html', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await page.goto('/gemini-search/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(screenshotsDir, '15-gemini-search.png'),
      fullPage: true
    });

    console.log('✅ Screenshot 15: Busca com Gemini AI capturada');
  });
});
