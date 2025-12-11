// doc-generator.spec.js
// Script otimizado para gerar documentação do sistema

const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Configuração
const screenshotsDir = path.join(__dirname, '../documentation/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Credenciais de teste
const USER = { username: 'admin', password: 'admin123' };

// Helper para fazer login
async function login(page) {
  await page.goto('/login.html');
  await page.waitForLoadState('networkidle');
  await page.fill('input[id="username"]', USER.username);
  await page.fill('input[id="password"]', USER.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

test.describe('Documentação do Sistema CRM', () => {
  test('Capturar todas as telas do sistema', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    try {
      // 1. Tela de Login
      console.log('📸 Capturando tela de login...');
      await page.goto('/login.html');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotsDir, '01-login-inicial.png'),
        fullPage: true
      });

      // 2. Login com credenciais
      console.log('📸 Capturando login preenchido...');
      await page.fill('input[id="email"]', USER.username);
      await page.fill('input[id="password"]', USER.password);
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotsDir, '02-login-preenchido.png'),
        fullPage: true
      });

      // 3. Dashboard Principal
      console.log('📸 Capturando dashboard principal...');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: path.join(screenshotsDir, '03-dashboard-principal.png'),
        fullPage: true
      });

      // 4. Menu do Usuário
      console.log('📸 Capturando menu do usuário...');
      const menuButton = page.locator('#userMenuButton').first();
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(screenshotsDir, '04-menu-usuario.png'),
          fullPage: true
        });
        await menuButton.click(); // Fechar menu
        await page.waitForTimeout(300);
      }

      // 5. Barra de Pesquisa
      console.log('📸 Capturando busca de clientes...');
      const searchInput = page.locator('#searchInput');
      await searchInput.fill('Cliente');
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotsDir, '05-busca-clientes.png'),
        fullPage: true
      });
      await searchInput.clear();

      // 6. Filtros
      console.log('📸 Capturando área de filtros...');
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(screenshotsDir, '06-filtros-sistema.png'),
        fullPage: true
      });

      // 7. Lista de Clientes
      console.log('📸 Capturando lista de clientes...');
      await page.evaluate(() => {
        const table = document.querySelector('table');
        if (table) table.scrollIntoView({ behavior: 'smooth' });
      });
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: path.join(screenshotsDir, '07-lista-clientes.png'),
        fullPage: true
      });

      // 8. Gestão de Vendedores
      console.log('📸 Capturando gestão de vendedores...');
      await page.goto('/gestao-vendedores.html');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(screenshotsDir, '08-gestao-vendedores.png'),
        fullPage: true
      });

      // 9. Gestão de Equipe
      console.log('📸 Capturando gestão de equipe...');
      await page.goto('/gestao-equipe.html');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(screenshotsDir, '09-gestao-equipe.png'),
        fullPage: true
      });

      // 10. Comunicação da Equipe
      console.log('📸 Capturando comunicação da equipe...');
      await page.goto('/comunicacao-equipe.html');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(screenshotsDir, '10-comunicacao-equipe.png'),
        fullPage: true
      });

      // 11. Liberações e Etapas
      console.log('📸 Capturando liberações e etapas...');
      await page.goto('/liberacoes-etapas.html');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(screenshotsDir, '11-liberacoes-etapas.png'),
        fullPage: true
      });

      // 12. Busca Avançada de Contratos
      console.log('📸 Capturando busca de contratos...');
      await page.goto('/search.html');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(screenshotsDir, '12-busca-contratos.png'),
        fullPage: true
      });

      // 13. Busca com Gemini AI
      console.log('📸 Capturando busca com Gemini...');
      await page.goto('/gemini-search/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(screenshotsDir, '13-gemini-search.png'),
        fullPage: true
      });

      // 14. Detalhes do Cliente (voltar ao dashboard e clicar em um cliente)
      console.log('📸 Capturando detalhes do cliente...');
      await page.goto('/index.html');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForTimeout(2000);
        await page.screenshot({
          path: path.join(screenshotsDir, '14-detalhes-cliente.png'),
          fullPage: true
        });
      }

      console.log('\n✅ Documentação gerada com sucesso!');
      console.log(`📁 Screenshots salvos em: ${screenshotsDir}`);
      console.log(`📊 Total de screenshots: ${fs.readdirSync(screenshotsDir).length}`);

    } catch (error) {
      console.error('❌ Erro ao capturar screenshots:', error);
      throw error;
    } finally {
      await context.close();
    }
  });
});
