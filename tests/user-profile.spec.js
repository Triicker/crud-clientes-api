const { test, expect } = require('@playwright/test');

test.describe('User Profile Page', () => {
    test.beforeEach(async ({ page }) => {
        // Fazer login antes de cada teste
        await page.goto('http://localhost:3000/login.html');
        
        // Preencher formulário de login
        await page.fill('#loginEmail', 'admin@etica.com.br');
        await page.fill('#loginPassword', 'admin123');
        
        // Clicar no botão de login
        await page.click('button[type="submit"]');
        
        // Aguardar redirecionamento para a página principal
        await page.waitForURL('**/index.html', { timeout: 5000 });
        await page.waitForTimeout(1000);
    });

    test('should navigate to profile page when clicking username button', async ({ page }) => {
        // Clicar no botão do usuário
        const userInfoButton = page.locator('#userInfoButton');
        await expect(userInfoButton).toBeVisible({ timeout: 5000 });
        await userInfoButton.click();
        
        // Verificar se foi redirecionado para a página de perfil
        await page.waitForURL('**/user-profile.html', { timeout: 5000 });
        expect(page.url()).toContain('user-profile.html');
    });

    test('should load user profile data correctly', async ({ page }) => {
        // Navegar para a página de perfil
        await page.goto('http://localhost:3000/user-profile.html');
        
        // Aguardar o carregamento dos dados
        await page.waitForTimeout(2000);
        
        // Verificar se os elementos estão visíveis
        const profileName = page.locator('#profileName');
        await expect(profileName).toBeVisible({ timeout: 5000 });
        
        // Verificar se o nome não é "-" (carregou dados)
        const nameText = await profileName.textContent();
        expect(nameText).not.toBe('-');
        
        // Verificar email
        const profileEmail = page.locator('#profileEmail');
        await expect(profileEmail).toBeVisible();
        const emailText = await profileEmail.textContent();
        expect(emailText).toContain('@');
    });

    test('should enable inline editing when clicking Edit Profile button', async ({ page }) => {
        // Navegar para a página de perfil
        await page.goto('http://localhost:3000/user-profile.html');
        await page.waitForTimeout(2000);
        
        // Clicar no botão Editar Perfil
        const editButton = page.locator('#editProfileButton');
        await expect(editButton).toBeVisible({ timeout: 5000 });
        await editButton.click();
        
        // Verificar se os inputs ficaram visíveis
        const nameInput = page.locator('#profileNameInput');
        await expect(nameInput).toBeVisible({ timeout: 2000 });
        
        // Verificar se os botões de salvar e cancelar aparecem
        const saveButton = page.locator('#saveProfileButton');
        const cancelButton = page.locator('#cancelEditButton');
        await expect(saveButton).toBeVisible();
        await expect(cancelButton).toBeVisible();
        
        // Verificar se o botão editar foi ocultado
        await expect(editButton).toBeHidden();
    });

    test('should cancel inline editing when clicking Cancel button', async ({ page }) => {
        // Navegar para a página de perfil
        await page.goto('http://localhost:3000/user-profile.html');
        await page.waitForTimeout(2000);
        
        // Clicar no botão Editar Perfil
        await page.click('#editProfileButton');
        await page.waitForTimeout(500);
        
        // Clicar no botão Cancelar
        await page.click('#cancelEditButton');
        
        // Verificar se os inputs foram ocultados
        const nameInput = page.locator('#profileNameInput');
        await expect(nameInput).toBeHidden({ timeout: 2000 });
        
        // Verificar se o botão editar voltou
        const editButton = page.locator('#editProfileButton');
        await expect(editButton).toBeVisible();
    });

    test('should save profile changes with valid data', async ({ page }) => {
        // Navegar para a página de perfil
        await page.goto('http://localhost:3000/user-profile.html');
        await page.waitForTimeout(2000);
        
        // Clicar no botão Editar Perfil
        await page.click('#editProfileButton');
        await page.waitForTimeout(500);
        
        // Preencher o campo de telefone
        const phoneInput = page.locator('#profilePhoneInput');
        await phoneInput.fill('(11) 98765-4321');
        
        // Clicar em Salvar
        await page.click('#saveProfileButton');
        
        // Aguardar toast de sucesso
        await page.waitForSelector('.toast-success', { timeout: 5000 });
        
        // Verificar se voltou ao modo visualização
        await page.waitForTimeout(1000);
        const editButton = page.locator('#editProfileButton');
        await expect(editButton).toBeVisible();
    });

    test('should show error when saving with empty required fields', async ({ page }) => {
        // Navegar para a página de perfil
        await page.goto('http://localhost:3000/user-profile.html');
        await page.waitForTimeout(2000);
        
        // Clicar no botão Editar Perfil
        await page.click('#editProfileButton');
        await page.waitForTimeout(500);
        
        // Limpar campo de nome
        const nameInput = page.locator('#profileNameInput');
        await nameInput.fill('');
        
        // Clicar em Salvar
        await page.click('#saveProfileButton');
        
        // Aguardar toast de erro
        await page.waitForSelector('.toast-error', { timeout: 5000 });
        
        // Verificar mensagem de erro
        const errorToast = page.locator('.toast-error');
        await expect(errorToast).toContainText('obrigatórios');
    });

    test('should navigate back when clicking Back button', async ({ page }) => {
        // Navegar para a página de perfil
        await page.goto('http://localhost:3000/user-profile.html');
        await page.waitForTimeout(2000);
        
        // Clicar no botão Voltar
        const backButton = page.locator('#backButton');
        await expect(backButton).toBeVisible({ timeout: 5000 });
        await backButton.click();
        
        // Verificar se voltou para a página principal
        await page.waitForURL('**/index.html', { timeout: 5000 });
        expect(page.url()).toContain('index.html');
    });

    test('should display user statistics', async ({ page }) => {
        // Navegar para a página de perfil
        await page.goto('http://localhost:3000/user-profile.html');
        await page.waitForTimeout(3000);
        
        // Verificar se os cards de estatísticas estão visíveis
        const statClientes = page.locator('#statClientes');
        const statTarefas = page.locator('#statTarefas');
        const statInteracoes = page.locator('#statInteracoes');
        const statMeta = page.locator('#statMeta');
        
        await expect(statClientes).toBeVisible({ timeout: 5000 });
        await expect(statTarefas).toBeVisible();
        await expect(statInteracoes).toBeVisible();
        await expect(statMeta).toBeVisible();
    });
});

test.describe('Create User Button', () => {
    test.beforeEach(async ({ page }) => {
        // Fazer login como admin
        await page.goto('http://localhost:3000/login.html');
        await page.fill('#loginEmail', 'admin@etica.com.br');
        await page.fill('#loginPassword', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/index.html', { timeout: 5000 });
        await page.waitForTimeout(1000);
    });

    test('should display create user button for admin', async ({ page }) => {
        // Verificar se o botão de criar usuário está visível
        const createUserButton = page.locator('#createUserButton');
        await expect(createUserButton).toBeVisible({ timeout: 5000 });
    });

    test('should open create user modal when clicking button', async ({ page }) => {
        // Clicar no botão de criar usuário
        const createUserButton = page.locator('#createUserButton');
        await expect(createUserButton).toBeVisible({ timeout: 5000 });
        await createUserButton.click();
        
        // Verificar se o modal foi aberto
        const modal = page.locator('#createUserModal');
        await expect(modal).toBeVisible({ timeout: 3000 });
        
        // Verificar se os campos do formulário estão presentes
        await expect(page.locator('#newUserName')).toBeVisible();
        await expect(page.locator('#newUserEmail')).toBeVisible();
        await expect(page.locator('#newUserPassword')).toBeVisible();
    });
});

test.describe('Client Table with Delete Button', () => {
    test.beforeEach(async ({ page }) => {
        // Fazer login
        await page.goto('http://localhost:3000/login.html');
        await page.fill('#loginEmail', 'admin@etica.com.br');
        await page.fill('#loginPassword', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/index.html', { timeout: 5000 });
        await page.waitForTimeout(2000);
    });

    test('should display delete buttons in client table', async ({ page }) => {
        // Aguardar carregamento da tabela
        await page.waitForSelector('.client-row', { timeout: 10000 });
        
        // Verificar se os botões de deletar estão presentes
        const deleteButtons = page.locator('.delete-btn');
        const count = await deleteButtons.count();
        
        expect(count).toBeGreaterThan(0);
    });

    test('should show confirmation dialog when clicking delete button', async ({ page }) => {
        // Aguardar carregamento da tabela
        await page.waitForSelector('.client-row', { timeout: 10000 });
        
        // Preparar para interceptar o dialog
        page.on('dialog', async dialog => {
            expect(dialog.type()).toBe('confirm');
            expect(dialog.message()).toContain('excluir');
            await dialog.dismiss();
        });
        
        // Clicar no primeiro botão de deletar
        const firstDeleteBtn = page.locator('.delete-btn').first();
        await firstDeleteBtn.click();
        
        // Aguardar um pouco para garantir que o dialog foi disparado
        await page.waitForTimeout(500);
    });

    test('should load clients successfully', async ({ page }) => {
        // Aguardar carregamento da tabela
        await page.waitForSelector('.client-row', { timeout: 10000 });
        
        // Contar linhas de clientes
        const clientRows = page.locator('.client-row');
        const count = await clientRows.count();
        
        console.log(`✅ ${count} clientes carregados`);
        expect(count).toBeGreaterThan(0);
    });
});
