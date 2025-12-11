/**
 * Testes para o Calendário/Histórico do Cliente
 * Valida a funcionalidade do botão de calendário e modal
 * Layout compacto com múltiplos mini-meses
 */
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';
const ADMIN_USER = { email: 'carlos.silva@empresa.com', senha: '123456' };

test.describe('Calendário/Histórico do Cliente', () => {
    
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto(`${BASE_URL}/login.html`);
        await page.fill('input[name="email"], input#email', ADMIN_USER.email);
        await page.fill('input[name="senha"], input#password, input[type="password"]', ADMIN_USER.senha);
        await page.click('button[type="submit"]');
        
        await page.waitForURL(/index\.html|\/$/);
        await page.waitForTimeout(1000);
        await page.waitForLoadState('networkidle');
    });

    test('Botão de calendário está visível na tabela de clientes', async ({ page }) => {
        // Aguardar tabela carregar
        await page.waitForSelector('.client-row', { timeout: 10000 });
        
        // Verificar se o botão de calendário existe
        const calendarBtn = page.locator('.calendar-btn').first();
        await expect(calendarBtn).toBeVisible();
        
        // Verificar se o botão tem o title correto
        await expect(calendarBtn).toHaveAttribute('title', 'Histórico/Calendário');
    });

    test('Clicar no botão de calendário abre o modal', async ({ page }) => {
        // Aguardar tabela carregar
        await page.waitForSelector('.client-row', { timeout: 10000 });
        
        // Clicar no botão de calendário do primeiro cliente
        const calendarBtn = page.locator('.calendar-btn').first();
        await calendarBtn.click();
        
        // Verificar se o modal abriu
        const modal = page.locator('#calendar-modal');
        await expect(modal).toHaveClass(/active/);
        
        // Verificar elementos do modal (layout compacto)
        await expect(page.locator('.calendar-modal-header')).toBeVisible();
        await expect(page.locator('.year-nav')).toBeVisible();
        await expect(page.locator('.mini-calendars-grid')).toBeVisible();
    });

    test('Modal de calendário exibe 4 mini-meses', async ({ page }) => {
        await page.waitForSelector('.client-row', { timeout: 10000 });
        
        // Abrir modal
        await page.locator('.calendar-btn').first().click();
        await page.waitForSelector('#calendar-modal.active');
        
        // Verificar que existem 4 mini-calendários
        const miniCalendars = page.locator('.mini-calendar');
        await expect(miniCalendars).toHaveCount(4);
        
        // Verificar que cada mini-calendário tem dias da semana
        const weekdayHeaders = page.locator('.mini-calendar-weekdays');
        await expect(weekdayHeaders).toHaveCount(4);
        
        // Verificar que tem dias no calendário
        const days = page.locator('.mini-day:not(.empty)');
        const count = await days.count();
        expect(count).toBeGreaterThan(100); // 4 meses * ~28 dias
        
        // Verificar que o dia de hoje está marcado
        const today = page.locator('.mini-day.today');
        await expect(today).toBeVisible();
    });

    test('Navegação entre meses funciona', async ({ page }) => {
        await page.waitForSelector('.client-row', { timeout: 10000 });
        
        // Abrir modal
        await page.locator('.calendar-btn').first().click();
        await page.waitForSelector('#calendar-modal.active');
        
        // Capturar ano atual
        const anoAtual = await page.locator('.current-year').textContent();
        console.log('📅 Ano atual:', anoAtual);
        
        // Verificar primeiro mini-calendário do mês atual
        const primeiroMes = await page.locator('.mini-calendar-header').first().textContent();
        console.log('📅 Primeiro mês:', primeiroMes);
        
        // Clicar para ir ao mês anterior
        await page.click('#prevMonth');
        await page.waitForTimeout(500);
        
        const primeiroMesAnterior = await page.locator('.mini-calendar-header').first().textContent();
        console.log('📅 Após prevMonth:', primeiroMesAnterior);
        
        // Os meses devem ser diferentes
        expect(primeiroMesAnterior).not.toBe(primeiroMes);
        
        // Voltar para o próximo mês
        await page.click('#nextMonth');
        await page.waitForTimeout(500);
        
        const mesVoltou = await page.locator('.mini-calendar-header').first().textContent();
        expect(mesVoltou).toBe(primeiroMes);
    });

    test('Clicar em um dia mostra tabela de horários', async ({ page }) => {
        await page.waitForSelector('.client-row', { timeout: 10000 });
        
        // Abrir modal
        await page.locator('.calendar-btn').first().click();
        await page.waitForSelector('#calendar-modal.active');
        
        // Clicar em um dia do calendário (mini-day)
        const dayEl = page.locator('.mini-day:not(.empty)').first();
        await dayEl.click();
        
        // O dia deve ficar selecionado
        await expect(dayEl).toHaveClass(/selected/);
        
        // Verificar se a tabela de horários apareceu
        const scheduleGrid = page.locator('.schedule-grid');
        await expect(scheduleGrid).toBeVisible();
        
        // Verificar botão de adicionar
        const addBtn = page.locator('#addEventBtn');
        await expect(addBtn).toBeVisible();
    });

    test('Fechar modal de calendário funciona', async ({ page }) => {
        await page.waitForSelector('.client-row', { timeout: 10000 });
        
        // Abrir modal
        await page.locator('.calendar-btn').first().click();
        await page.waitForSelector('#calendar-modal.active');
        
        // Fechar com botão X
        await page.click('#closeCalendarModal');
        
        // Modal deve fechar
        const modal = page.locator('#calendar-modal');
        await expect(modal).not.toHaveClass(/active/);
    });

    test('Navegação entre anos funciona', async ({ page }) => {
        await page.waitForSelector('.client-row', { timeout: 10000 });
        
        // Abrir modal
        await page.locator('.calendar-btn').first().click();
        await page.waitForSelector('#calendar-modal.active');
        
        // Capturar ano atual
        const anoAtual = await page.locator('.current-year').textContent();
        const anoAtualNum = parseInt(anoAtual.trim());
        console.log('📅 Ano atual:', anoAtualNum);
        
        // Ir para ano anterior
        await page.click('#prevYear');
        await page.waitForTimeout(500);
        
        const anoAnterior = await page.locator('.current-year').textContent();
        expect(parseInt(anoAnterior.trim())).toBe(anoAtualNum - 1);
        
        // Voltar para ano atual
        await page.click('#nextYear');
        await page.waitForTimeout(500);
        
        const anoVoltou = await page.locator('.current-year').textContent();
        expect(parseInt(anoVoltou.trim())).toBe(anoAtualNum);
    });
});
