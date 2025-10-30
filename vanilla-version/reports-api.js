const express = require('express');
const { Pool } = require('pg');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

const router = express.Router();

// Pool de conexão PostgreSQL - usando as mesmas configurações do backend
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'gestao_educacional',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});

// Diretório para armazenar relatórios gerados
const REPORTS_DIR = path.join(__dirname, '../generated-reports');

// Garantir que o diretório existe
async function ensureReportsDir() {
    try {
        await fs.access(REPORTS_DIR);
    } catch {
        await fs.mkdir(REPORTS_DIR, { recursive: true });
    }
}

// ============================================
// ENDPOINTS PRINCIPAIS
// ============================================

// Listar templates de relatórios disponíveis
router.get('/templates', async (req, res) => {
    try {
        const { category, search } = req.query;
        
        let query = `
            SELECT 
                id,
                template_code,
                template_name,
                category,
                description,
                format_options,
                parameters,
                created_at
            FROM report_templates 
            WHERE is_active = true
        `;
        
        const params = [];
        
        if (category) {
            query += ' AND category = $' + (params.length + 1);
            params.push(category);
        }
        
        if (search) {
            query += ' AND (template_name ILIKE $' + (params.length + 1) + 
                     ' OR description ILIKE $' + (params.length + 1) + ')';
            params.push(`%${search}%`);
        }
        
        query += ' ORDER BY category, template_name';
        
        const result = await pool.query(query, params);
        
        // Agrupar por categoria
        const grouped = result.rows.reduce((acc, template) => {
            const category = template.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(template);
            return acc;
        }, {});
        
        res.json({
            success: true,
            templates: grouped,
            total: result.rows.length
        });
        
    } catch (error) {
        console.error('Erro ao buscar templates:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Obter template específico com preview dos dados
router.get('/templates/:templateCode/preview', async (req, res) => {
    try {
        const { templateCode } = req.params;
        const { limit = 10 } = req.query;
        
        // Buscar template
        const templateResult = await pool.query(
            'SELECT * FROM report_templates WHERE template_code = $1 AND is_active = true',
            [templateCode]
        );
        
        if (templateResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Template não encontrado'
            });
        }
        
        const template = templateResult.rows[0];
        
        // Executar query com LIMIT para preview
        let previewQuery = template.sql_query;
        if (!previewQuery.toLowerCase().includes('limit')) {
            previewQuery += ` LIMIT ${parseInt(limit)}`;
        }
        
        const dataResult = await pool.query(previewQuery);
        
        res.json({
            success: true,
            template: {
                id: template.id,
                name: template.template_name,
                category: template.category,
                description: template.description,
                parameters: template.parameters,
                chart_config: template.chart_config
            },
            preview_data: dataResult.rows,
            columns: dataResult.fields?.map(field => ({
                name: field.name,
                type: field.dataTypeID
            })) || []
        });
        
    } catch (error) {
        console.error('Erro ao gerar preview:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao gerar preview: ' + error.message
        });
    }
});

// Gerar relatório
router.post('/generate', async (req, res) => {
    try {
        const {
            template_code,
            format = 'html',
            parameters = {},
            title,
            user_id
        } = req.body;
        
        if (!template_code) {
            return res.status(400).json({
                success: false,
                error: 'Código do template é obrigatório'
            });
        }
        
        // Buscar template
        const templateResult = await pool.query(
            'SELECT * FROM report_templates WHERE template_code = $1 AND is_active = true',
            [template_code]
        );
        
        if (templateResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Template não encontrado'
            });
        }
        
        const template = templateResult.rows[0];
        
        // Registrar relatório como "processando"
        const reportResult = await pool.query(`
            INSERT INTO generated_reports (
                template_id, report_title, parameters, format, 
                status, generated_by, expires_at
            ) VALUES ($1, $2, $3, $4, 'processing', $5, $6)
            RETURNING id
        `, [
            template.id,
            title || template.template_name,
            JSON.stringify(parameters),
            format,
            user_id,
            new Date(Date.now() + 24 * 60 * 60 * 1000) // Expira em 24h
        ]);
        
        const reportId = reportResult.rows[0].id;
        
        // Processar relatório em background
        processReportAsync(reportId, template, parameters, format);
        
        res.json({
            success: true,
            report_id: reportId,
            status: 'processing',
            message: 'Relatório sendo processado'
        });
        
    } catch (error) {
        console.error('Erro ao iniciar geração de relatório:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Verificar status do relatório
router.get('/status/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;
        
        const result = await pool.query(`
            SELECT 
                gr.*,
                rt.template_name,
                rt.category
            FROM generated_reports gr
            JOIN report_templates rt ON gr.template_id = rt.id
            WHERE gr.id = $1
        `, [reportId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Relatório não encontrado'
            });
        }
        
        const report = result.rows[0];
        
        res.json({
            success: true,
            report: {
                id: report.id,
                title: report.report_title,
                template_name: report.template_name,
                category: report.category,
                format: report.format,
                status: report.status,
                error_message: report.error_message,
                generated_at: report.generated_at,
                file_size: report.file_size,
                download_count: report.download_count
            }
        });
        
    } catch (error) {
        console.error('Erro ao verificar status:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Download do relatório
router.get('/download/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;
        
        const result = await pool.query(`
            SELECT * FROM generated_reports 
            WHERE id = $1 AND status = 'completed'
        `, [reportId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Relatório não encontrado ou não está pronto'
            });
        }
        
        const report = result.rows[0];
        const filePath = report.file_path;
        
        // Verificar se arquivo existe
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({
                success: false,
                error: 'Arquivo do relatório não encontrado'
            });
        }
        
        // Atualizar contador de downloads
        await pool.query(`
            UPDATE generated_reports 
            SET download_count = download_count + 1,
                last_downloaded_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [reportId]);
        
        // Configurar headers para download
        const extension = path.extname(filePath);
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.csv': 'text/csv',
            '.html': 'text/html'
        };
        
        const fileName = `${report.report_title.replace(/[^a-zA-Z0-9]/g, '_')}_${reportId}${extension}`;
        
        res.setHeader('Content-Type', mimeTypes[extension] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        // Enviar arquivo
        const fileBuffer = await fs.readFile(filePath);
        res.send(fileBuffer);
        
    } catch (error) {
        console.error('Erro ao fazer download:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Listar relatórios gerados do usuário
router.get('/history', async (req, res) => {
    try {
        const { 
            user_id, 
            page = 1, 
            limit = 20, 
            status, 
            category 
        } = req.query;
        
        let query = `
            SELECT 
                gr.id,
                gr.report_title,
                gr.format,
                gr.status,
                gr.generated_at,
                gr.file_size,
                gr.download_count,
                rt.template_name,
                rt.category
            FROM generated_reports gr
            JOIN report_templates rt ON gr.template_id = rt.id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (user_id) {
            query += ' AND gr.generated_by = $' + (params.length + 1);
            params.push(user_id);
        }
        
        if (status) {
            query += ' AND gr.status = $' + (params.length + 1);
            params.push(status);
        }
        
        if (category) {
            query += ' AND rt.category = $' + (params.length + 1);
            params.push(category);
        }
        
        query += ' ORDER BY gr.generated_at DESC';
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), offset);
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            reports: result.rows,
            page: parseInt(page),
            limit: parseInt(limit)
        });
        
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// ============================================
// FUNÇÕES DE PROCESSAMENTO
// ============================================

// Processar relatório assincronamente
async function processReportAsync(reportId, template, parameters, format) {
    try {
        await ensureReportsDir();
        
        // Executar query do relatório
        const data = await executeReportQuery(template.sql_query, parameters);
        
        // Gerar arquivo baseado no formato
        let filePath;
        let fileSize;
        
        switch (format) {
            case 'pdf':
                filePath = await generatePDFReport(reportId, template, data);
                break;
            case 'excel':
                filePath = await generateExcelReport(reportId, template, data);
                break;
            case 'csv':
                filePath = await generateCSVReport(reportId, template, data);
                break;
            case 'html':
                filePath = await generateHTMLReport(reportId, template, data);
                break;
            default:
                throw new Error('Formato não suportado: ' + format);
        }
        
        // Obter tamanho do arquivo
        const stats = await fs.stat(filePath);
        fileSize = stats.size;
        
        // Atualizar status no banco
        await pool.query(`
            UPDATE generated_reports 
            SET status = 'completed', 
                file_path = $1, 
                file_size = $2
            WHERE id = $3
        `, [filePath, fileSize, reportId]);
        
        console.log(`Relatório ${reportId} gerado com sucesso: ${filePath}`);
        
    } catch (error) {
        console.error(`Erro ao processar relatório ${reportId}:`, error);
        
        // Atualizar status de erro
        await pool.query(`
            UPDATE generated_reports 
            SET status = 'error', 
                error_message = $1
            WHERE id = $2
        `, [error.message, reportId]);
    }
}

// Executar query com parâmetros
async function executeReportQuery(sqlQuery, parameters) {
    // Construir condições WHERE baseadas nos parâmetros
    let whereConditions = '';
    const paramValues = [];
    
    Object.entries(parameters).forEach(([key, value]) => {
        if (value && value !== '') {
            switch (key) {
                case 'state':
                    whereConditions += (whereConditions ? ' AND ' : ' WHERE ') + 
                        'c.state_code = $' + (paramValues.length + 1);
                    paramValues.push(value);
                    break;
                case 'client_type':
                    whereConditions += (whereConditions ? ' AND ' : ' WHERE ') + 
                        'c.client_type = $' + (paramValues.length + 1);
                    paramValues.push(value);
                    break;
                case 'year':
                    whereConditions += (whereConditions ? ' AND ' : ' WHERE ') + 
                        'EXTRACT(YEAR FROM c.created_at) = $' + (paramValues.length + 1);
                    paramValues.push(parseInt(value));
                    break;
            }
        }
    });
    
    // Aplicar condições à query se ela não tiver WHERE
    let finalQuery = sqlQuery;
    if (whereConditions && !sqlQuery.toLowerCase().includes('where')) {
        finalQuery += whereConditions;
    }
    
    const result = await pool.query(finalQuery, paramValues);
    return result.rows;
}

// Gerar relatório PDF
async function generatePDFReport(reportId, template, data) {
    const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
    });
    
    const filePath = path.join(REPORTS_DIR, `report_${reportId}.pdf`);
    const stream = require('fs').createWriteStream(filePath);
    doc.pipe(stream);
    
    // Cabeçalho
    doc.fontSize(20)
       .text(template.template_name, { align: 'center' })
       .moveDown();
    
    doc.fontSize(12)
       .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'right' })
       .text(`Categoria: ${template.category}`)
       .moveDown();
    
    if (template.description) {
        doc.text(template.description)
           .moveDown();
    }
    
    // Dados em formato de tabela (simplificado)
    if (data.length > 0) {
        const keys = Object.keys(data[0]);
        
        // Cabeçalho da tabela
        let y = doc.y;
        keys.forEach((key, index) => {
            doc.text(key, 50 + (index * 80), y, { width: 75 });
        });
        
        doc.moveDown();
        
        // Dados da tabela
        data.forEach(row => {
            y = doc.y;
            keys.forEach((key, index) => {
                const value = row[key]?.toString() || '';
                doc.text(value, 50 + (index * 80), y, { width: 75 });
            });
            doc.moveDown(0.5);
            
            // Nova página se necessário
            if (doc.y > 700) {
                doc.addPage();
            }
        });
    }
    
    // Rodapé
    doc.fontSize(10)
       .text(`Total de registros: ${data.length}`, 50, 750);
    
    doc.end();
    
    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
}

// Gerar relatório Excel
async function generateExcelReport(reportId, template, data) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(template.template_name);
    
    if (data.length > 0) {
        const columns = Object.keys(data[0]).map(key => ({
            header: key,
            key: key,
            width: 15
        }));
        
        worksheet.columns = columns;
        
        // Estilo do cabeçalho
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        
        // Adicionar dados
        data.forEach(row => {
            worksheet.addRow(row);
        });
        
        // Auto-ajustar larguras das colunas
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const columnLength = cell.value ? cell.value.toString().length : 10;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            column.width = maxLength < 10 ? 10 : maxLength;
        });
    }
    
    const filePath = path.join(REPORTS_DIR, `report_${reportId}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    
    return filePath;
}

// Gerar relatório CSV
async function generateCSVReport(reportId, template, data) {
    if (data.length === 0) {
        throw new Error('Nenhum dado disponível para o relatório');
    }
    
    const keys = Object.keys(data[0]);
    
    // Cabeçalho CSV
    let csv = keys.join(',') + '\n';
    
    // Dados CSV
    data.forEach(row => {
        const values = keys.map(key => {
            let value = row[key]?.toString() || '';
            // Escapar aspas e vírgulas
            if (value.includes(',') || value.includes('"')) {
                value = '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
        });
        csv += values.join(',') + '\n';
    });
    
    const filePath = path.join(REPORTS_DIR, `report_${reportId}.csv`);
    await fs.writeFile(filePath, csv, 'utf8');
    
    return filePath;
}

// Gerar relatório HTML
async function generateHTMLReport(reportId, template, data) {
    const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${template.template_name}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    background: #f5f5f5;
                }
                .container { 
                    background: white; 
                    padding: 30px; 
                    border-radius: 8px; 
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #4CAF50;
                    padding-bottom: 20px;
                }
                .meta { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 6px; 
                    margin-bottom: 20px;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px;
                }
                th, td { 
                    padding: 12px; 
                    text-align: left; 
                    border-bottom: 1px solid #ddd;
                }
                th { 
                    background-color: #4CAF50; 
                    color: white;
                    font-weight: bold;
                }
                tr:hover { 
                    background-color: #f5f5f5;
                }
                .summary {
                    background: #e8f5e8;
                    padding: 15px;
                    border-radius: 6px;
                    margin-top: 20px;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${template.template_name}</h1>
                    <p>${template.category}</p>
                </div>
                
                <div class="meta">
                    <p><strong>Descrição:</strong> ${template.description || 'Relatório personalizado'}</p>
                    <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                    <p><strong>Total de registros:</strong> ${data.length}</p>
                </div>
                
                ${generateHTMLTable(data)}
                
                <div class="summary">
                    Relatório gerado automaticamente pelo Sistema de Gestão Educacional
                </div>
            </div>
        </body>
        </html>
    `;
    
    const filePath = path.join(REPORTS_DIR, `report_${reportId}.html`);
    await fs.writeFile(filePath, html, 'utf8');
    
    return filePath;
}

// Função auxiliar para gerar tabela HTML
function generateHTMLTable(data) {
    if (data.length === 0) {
        return '<p>Nenhum dado disponível.</p>';
    }
    
    const keys = Object.keys(data[0]);
    
    let html = '<table><thead><tr>';
    keys.forEach(key => {
        html += `<th>${key}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    data.forEach(row => {
        html += '<tr>';
        keys.forEach(key => {
            const value = row[key]?.toString() || '';
            html += `<td>${value}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    return html;
}

// ============================================
// AGENDAMENTOS E AUTOMAÇÃO
// ============================================

// Configurar cron jobs para relatórios agendados
function setupReportScheduler() {
    // Executar a cada hora para verificar agendamentos
    cron.schedule('0 * * * *', async () => {
        try {
            console.log('Verificando relatórios agendados...');
            
            const result = await pool.query(`
                SELECT 
                    rs.*,
                    rt.template_code,
                    rt.sql_query,
                    rt.template_name,
                    rt.chart_config
                FROM report_schedules rs
                JOIN report_templates rt ON rs.template_id = rt.id
                WHERE rs.is_active = true 
                    AND rs.next_run_at <= CURRENT_TIMESTAMP
            `);
            
            for (const schedule of result.rows) {
                await executeScheduledReport(schedule);
            }
            
        } catch (error) {
            console.error('Erro ao executar relatórios agendados:', error);
        }
    });
}

// Executar relatório agendado
async function executeScheduledReport(schedule) {
    try {
        console.log(`Executando relatório agendado: ${schedule.schedule_name}`);
        
        // Gerar relatório para cada formato solicitado
        for (const format of schedule.formats) {
            const reportResult = await pool.query(`
                INSERT INTO generated_reports (
                    template_id, report_title, parameters, format, 
                    status, expires_at
                ) VALUES ($1, $2, $3, $4, 'processing', $5)
                RETURNING id
            `, [
                schedule.template_id,
                `${schedule.schedule_name} - ${new Date().toLocaleDateString('pt-BR')}`,
                JSON.stringify(schedule.parameters),
                format,
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expira em 7 dias
            ]);
            
            const reportId = reportResult.rows[0].id;
            
            // Processar relatório
            const template = {
                id: schedule.template_id,
                template_code: schedule.template_code,
                template_name: schedule.template_name,
                sql_query: schedule.sql_query,
                chart_config: schedule.chart_config
            };
            
            await processReportAsync(reportId, template, schedule.parameters, format);
        }
        
        // Atualizar próxima execução
        const nextRun = calculateNextRun(schedule);
        await pool.query(`
            UPDATE report_schedules 
            SET last_run_at = CURRENT_TIMESTAMP,
                next_run_at = $1
            WHERE id = $2
        `, [nextRun, schedule.id]);
        
    } catch (error) {
        console.error(`Erro ao executar relatório agendado ${schedule.id}:`, error);
    }
}

// Calcular próxima execução
function calculateNextRun(schedule) {
    const now = new Date();
    const scheduleTime = schedule.schedule_time;
    
    switch (schedule.frequency) {
        case 'daily':
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(parseInt(scheduleTime.split(':')[0]));
            tomorrow.setMinutes(parseInt(scheduleTime.split(':')[1]));
            return tomorrow;
            
        case 'weekly':
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 7);
            nextWeek.setHours(parseInt(scheduleTime.split(':')[0]));
            nextWeek.setMinutes(parseInt(scheduleTime.split(':')[1]));
            return nextWeek;
            
        case 'monthly':
            const nextMonth = new Date(now);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            nextMonth.setDate(schedule.schedule_day || 1);
            nextMonth.setHours(parseInt(scheduleTime.split(':')[0]));
            nextMonth.setMinutes(parseInt(scheduleTime.split(':')[1]));
            return nextMonth;
            
        case 'quarterly':
            const nextQuarter = new Date(now);
            nextQuarter.setMonth(nextQuarter.getMonth() + 3);
            nextQuarter.setDate(schedule.schedule_day || 1);
            nextQuarter.setHours(parseInt(scheduleTime.split(':')[0]));
            nextQuarter.setMinutes(parseInt(scheduleTime.split(':')[1]));
            return nextQuarter;
            
        default:
            return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h por padrão
    }
}

// Inicializar scheduler
setupReportScheduler();

module.exports = router;