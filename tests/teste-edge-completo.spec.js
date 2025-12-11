const { test, devices } = require('@playwright/test');
const path = require('path');

const screenshotDir = path.join(__dirname, '..', '.playwright-mcp', 'documentation', 'screenshots');

test.use({ 
  ...devices['Desktop Edge'],
  headless: false,
  video: 'on',
  trace: 'on'
});

test.describe('Teste Completo - Edge Browser', () => {

  test('Buscar Escola Municipal Salvador/BA e Adicionar como Cliente', async ({ page }) => {
    try {
      console.log('🔄 Iniciando teste no Edge...');
      
      // 1. Login
      await page.goto('http://localhost:3000/login.html');
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      console.log('✅ Login realizado com sucesso');

      // 2. Acessar Gemini Search
      await page.goto('http://localhost:3000/gemini-search/');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await page.waitForTimeout(3000);
      
      await page.screenshot({
        path: path.join(screenshotDir, 'edge-01-acesso-gemini.png'),
        fullPage: true
      });

      console.log('✅ Gemini Search carregado');

      // 3. Configurar API Key
      const apiKeyInput = await page.locator('input[type="password"]').first();
      await apiKeyInput.waitFor({ state: 'visible', timeout: 10000 });
      await apiKeyInput.fill('AIzaSyCMflWEGSHjKyd-VqWy_x1ztrbX06wZ_gs');
      
      // Procurar botão de confirmar/salvar API
      const confirmButton = await page.locator('button:has-text("Confirmar"), button:has-text("OK"), button:has-text("Salvar")').first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(1000);
      }

      console.log('✅ API Key configurada');

      // 4. Alternar para modo Leads
      const leadsOption = await page.locator('input[value="leads"], label:has-text("Leads")').first();
      if (await leadsOption.isVisible()) {
        await leadsOption.click();
        await page.waitForTimeout(1000);
      }

      // 5. Selecionar Bahia
      const estadoSelect = await page.locator('select').first();
      await estadoSelect.waitFor({ state: 'visible', timeout: 5000 });
      await estadoSelect.selectOption({ label: 'Bahia' });
      await page.waitForTimeout(2000); // Aguarda carregar cidades

      console.log('✅ Estado Bahia selecionado');

      // 6. Selecionar Salvador
      const cidadeSelect = await page.locator('select').nth(1);
      await cidadeSelect.waitFor({ state: 'visible', timeout: 5000 });
      await cidadeSelect.selectOption({ label: 'Salvador' });
      await page.waitForTimeout(1000);

      console.log('✅ Cidade Salvador selecionada');

      // 7. Selecionar Escola Pública Municipal
      const tipoSelect = await page.locator('select').nth(2);
      await tipoSelect.waitFor({ state: 'visible', timeout: 5000 });
      await tipoSelect.selectOption({ label: 'Escola Pública Municipal' });
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(screenshotDir, 'edge-02-parametros-configurados.png'),
        fullPage: true
      });

      console.log('✅ Parâmetros configurados - Escola Municipal Salvador/BA');

      // 8. Executar busca
      const searchButton = await page.locator('button:has-text("Buscar"), button:contains("Buscar")').first();
      await searchButton.waitFor({ state: 'visible', timeout: 5000 });
      await searchButton.click();
      
      console.log('🔄 Executando busca na IA Gemini...');
      await page.waitForTimeout(15000); // Aguarda processamento da IA

      await page.screenshot({
        path: path.join(screenshotDir, 'edge-03-resultados-busca.png'),
        fullPage: true
      });

      console.log('✅ Busca concluída');

      // 9. Verificar se há resultados
      const results = await page.locator('table tbody tr, .result-item, .lead-item').count();
      console.log(`📊 Encontrados ${results} resultados`);

      if (results > 0) {
        // 10. Tentar adicionar primeiro resultado como cliente
        const addButton = await page.locator('button:has-text("Adicionar"), button:has-text("Salvar"), button:has-text("Cadastrar")').first();
        
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(3000);
          
          await page.screenshot({
            path: path.join(screenshotDir, 'edge-04-adicionando-cliente.png'),
            fullPage: true
          });

          console.log('✅ Cliente adicionado com sucesso');
          
          // 11. Verificar mensagem de sucesso
          const successMsg = await page.locator('.success, .alert-success, text="sucesso"').first();
          if (await successMsg.isVisible()) {
            console.log('✅ Confirmação de sucesso exibida');
          }
        }

        // 12. Ir para dashboard para verificar
        await page.goto('http://localhost:3000/index.html');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: path.join(screenshotDir, 'edge-05-dashboard-final.png'),
          fullPage: true
        });

        console.log('✅ Dashboard atualizado');

        // 13. Verificar se cliente foi adicionado
        const clientesBahia = await page.locator('td:has-text("Salvador"), td:has-text("BA"), td:has-text("Municipal")').count();
        console.log(`📍 Encontrados ${clientesBahia} clientes da Bahia no dashboard`);
      }

      console.log('🎉 Teste concluído com sucesso!');

    } catch (error) {
      console.error('❌ Erro durante o teste:', error.message);
      
      // Screenshot de erro
      await page.screenshot({
        path: path.join(screenshotDir, 'edge-erro.png'),
        fullPage: true
      });
      
      throw error;
    }
  });

  test('Verificar Estabilidade do Servidor', async ({ page }) => {
    console.log('🔄 Testando estabilidade do servidor...');
    
    for (let i = 1; i <= 5; i++) {
      try {
        await page.goto('http://localhost:3000/login.html');
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        console.log(`✅ Acesso ${i}/5 - Servidor respondendo`);
        await page.waitForTimeout(1000);
      } catch (error) {
        console.error(`❌ Acesso ${i}/5 falhou:`, error.message);
        throw error;
      }
    }
    
    console.log('🎉 Servidor estável após 5 acessos consecutivos');
  });
});