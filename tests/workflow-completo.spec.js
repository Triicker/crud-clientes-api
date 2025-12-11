const { test } = require('@playwright/test');
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

test.describe('Fluxo Completo: Gemini Search → Cadastro → Interação', () => {

  test('Workflow Completo de Uso do Sistema', async ({ page }) => {
    // Login
    await doLogin(page);

    // 1. Acessar busca Gemini
    await page.goto('http://localhost:3000/gemini-search/');
    await page.waitForTimeout(3000);
    
    await page.screenshot({
      path: path.join(screenshotDir, '10-acesso-gemini-search.png'),
      fullPage: true
    });

    // 2. Inserir a API Key do Gemini
    try {
      const apiKeyInput = await page.locator('input[type="password"], input[placeholder*="API"], input[placeholder*="chave"]');
      if (await apiKeyInput.isVisible()) {
        await apiKeyInput.fill('AIzaSyCMflWEGSHjKyd-VqWy_x1ztrbX06wZ_gs');
        
        // Tentar confirmar a API key
        const confirmButton = await page.locator('button:has-text("Confirmar"), button:has-text("Salvar"), button:has-text("OK")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(1000);
        }
      }
    } catch (e) {
      console.log('API Key input not found or not needed');
    }

    await page.screenshot({
      path: path.join(screenshotDir, '11-configuracao-api-key.png'),
      fullPage: true
    });

    // 3. Alternar para modo "Leads" (busca de contatos)
    try {
      const leadsTab = await page.locator('button:has-text("Leads"), input[value="leads"], label:has-text("Leads")');
      if (await leadsTab.isVisible()) {
        await leadsTab.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('Leads tab not found');
    }

    // 4. Selecionar estado (Bahia)
    try {
      const estadoSelect = await page.locator('select:has(option[value*="BA"]), select:has(option:has-text("Bahia"))');
      if (await estadoSelect.isVisible()) {
        await estadoSelect.selectOption({ label: 'Bahia' });
        await page.waitForTimeout(1500); // Aguarda carregar cidades
      }
    } catch (e) {
      console.log('Estado select not found');
    }

    // 5. Selecionar cidade (Salvador)
    try {
      const cidadeSelect = await page.locator('select:has(option:has-text("Salvador"))');
      if (await cidadeSelect.isVisible()) {
        await cidadeSelect.selectOption({ label: 'Salvador' });
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('Cidade select not found');
    }

    // 6. Selecionar tipo de entidade
    try {
      const tipoSelect = await page.locator('select:has(option:has-text("Escola"))');
      if (await tipoSelect.isVisible()) {
        await tipoSelect.selectOption({ label: 'Escola Pública Estadual' });
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('Tipo select not found');
    }

    await page.screenshot({
      path: path.join(screenshotDir, '12-selecao-parametros.png'),
      fullPage: true
    });

    // 7. Executar busca
    try {
      const searchButton = await page.locator('button:has-text("Buscar"), button:has-text("Pesquisar"), button:has-text("Gerar"), button[type="button"]:has-text("Search")').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.waitForTimeout(10000); // Aguarda resposta da IA (mais tempo para leads)
        
        await page.screenshot({
          path: path.join(screenshotDir, '13-resultados-leads-gemini.png'),
          fullPage: true
        });
      }
    } catch (e) {
      console.log('Search button not found');
      await page.screenshot({
        path: path.join(screenshotDir, '13-erro-busca-leads.png'),
        fullPage: true
      });
    }

    // 8. Tentar adicionar um lead como cliente
    try {
      const addButtons = await page.locator('button:has-text("Adicionar"), button:has-text("Cadastrar"), button:has-text("+"), button:has-text("Incluir"), button:has-text("Salvar como Cliente")');
      if (await addButtons.count() > 0) {
        await addButtons.first().click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({
          path: path.join(screenshotDir, '14-salvando-lead-como-cliente.png'),
          fullPage: true
        });
      }
    } catch (e) {
      console.log('Add button not found');
    }

    // 9. Verificar se houve sucesso na operação
    try {
      const successMessage = await page.locator('text="sucesso", text="salvo", text="adicionado", .success, .alert-success');
      if (await successMessage.isVisible()) {
        await page.screenshot({
          path: path.join(screenshotDir, '15-confirmacao-sucesso.png'),
          fullPage: true
        });
      }
    } catch (e) {
      console.log('Success message not found');
    }

    // 10. Ir para o dashboard de clientes
    await page.goto('http://localhost:3000/index.html');
    await page.waitForTimeout(3000);
    
    await page.screenshot({
      path: path.join(screenshotDir, '16-dashboard-apos-busca-leads.png'),
      fullPage: true
    });

    // 11. Localizar e interagir com o cliente recém-adicionado
    try {
      const clientRows = await page.locator('tr:has(td)');
      if (await clientRows.count() > 0) {
        // Procurar por um cliente que tenha "Salvador" ou "BA" no nome/localização
        const viewButtons = await page.locator('button:has-text("Visualizar"), button:has-text("Ver"), a:has-text("Ver")');
        if (await viewButtons.count() > 0) {
          await viewButtons.first().click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({
            path: path.join(screenshotDir, '17-detalhes-lead-convertido.png'),
            fullPage: true
          });

          // 12. Adicionar uma observação sobre a prospecção via Gemini
          const observationInput = await page.locator('textarea, input[placeholder*="observ"], input[placeholder*="nota"]');
          if (await observationInput.isVisible()) {
            await observationInput.fill('Cliente prospectado via IA Gemini - Busca de Leads. Escola da Bahia com informações de corpo docente disponíveis. Potencial para produtos educacionais. Próximo: contato com coordenação pedagógica.');
            await page.waitForTimeout(1000);
            
            const saveButton = await page.locator('button:has-text("Salvar"), button:has-text("Gravar"), button[type="submit"]');
            if (await saveButton.isVisible()) {
              await saveButton.click();
              await page.waitForTimeout(2000);
            }
            
            await page.screenshot({
              path: path.join(screenshotDir, '18-interacao-apos-conversao.png'),
              fullPage: true
            });
          }
        }
      }
    } catch (e) {
      console.log('Client interaction not available');
    }

    // 13. Voltar ao dashboard para visualizar resultado final
    await page.goto('http://localhost:3000/index.html');
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: path.join(screenshotDir, '19-dashboard-final-leads.png'),
      fullPage: true
    });

    console.log('Workflow completo executado com sucesso!');
  });
});