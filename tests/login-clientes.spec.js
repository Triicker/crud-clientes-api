// tests/login-clientes.spec.js
const { test, expect } = require('@playwright/test');

test('Login e carregamento de clientes', async ({ page }) => {
  // Acessa a página de login
  await page.goto('http://localhost:3000/login.html');

  // Aguarda o campo de email estar disponível
  await page.waitForSelector('input#email', { timeout: 10000 });

  // Preenche o formulário de login
  await page.fill('input#email', 'novo@admin.com');
  await page.fill('input#password', 'senha123');
  await page.click('button#loginBtn');

  // Aguarda redirecionamento para index.html
  await page.waitForURL('**/index.html', { timeout: 10000 });

  // Valida se o token foi salvo no localStorage
  const token = await page.evaluate(() => localStorage.getItem('token'));
  expect(token).toBeTruthy();

  // Valida se a tabela de clientes está visível
  await expect(page.locator('#clientTable')).toBeVisible();

  // Valida se há pelo menos um cliente listado
  const rows = await page.locator('#tableBody tr').count();
  expect(rows).toBeGreaterThan(0);

  // Valida se o nome do usuário aparece no header
  await expect(page.locator('#userName')).toContainText('admin');
});
