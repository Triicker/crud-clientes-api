/**
 * Utilitário de logging centralizado
 * Substitui console.log com níveis de log configuráveis
 */

const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

// Configuração do nível mínimo de log (pode ser controlado por variável de ambiente)
const MIN_LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';

const levelPriority = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

/**
 * Formata a mensagem de log com timestamp e nível
 */
function formatMessage(level, message, context = null) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
}

/**
 * Verifica se deve logar baseado no nível mínimo configurado
 */
function shouldLog(level) {
    return levelPriority[level] <= levelPriority[MIN_LOG_LEVEL];
}

/**
 * Logger de erros (sempre exibido)
 */
exports.error = (message, error = null) => {
    if (!shouldLog(LOG_LEVELS.ERROR)) return;
    
    console.error(formatMessage(LOG_LEVELS.ERROR, message));
    if (error) {
        console.error('Stack trace:', error.stack || error);
    }
};

/**
 * Logger de avisos
 */
exports.warn = (message, context = null) => {
    if (!shouldLog(LOG_LEVELS.WARN)) return;
    console.warn(formatMessage(LOG_LEVELS.WARN, message, context));
};

/**
 * Logger de informações (padrão)
 */
exports.info = (message, context = null) => {
    if (!shouldLog(LOG_LEVELS.INFO)) return;
    console.log(formatMessage(LOG_LEVELS.INFO, message, context));
};

/**
 * Logger de debug (apenas em desenvolvimento)
 */
exports.debug = (message, context = null) => {
    if (!shouldLog(LOG_LEVELS.DEBUG)) return;
    console.log(formatMessage(LOG_LEVELS.DEBUG, message, context));
};

/**
 * Logger de requisições HTTP
 */
exports.http = (req, res, duration) => {
    if (!shouldLog(LOG_LEVELS.INFO)) return;
    
    const message = `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`;
    const context = {
        ip: req.ip,
        userAgent: req.get('user-agent')
    };
    
    console.log(formatMessage(LOG_LEVELS.INFO, message, context));
};

/**
 * Logger de queries SQL (apenas em desenvolvimento)
 */
exports.sql = (query, params = null, duration = null) => {
    if (!shouldLog(LOG_LEVELS.DEBUG)) return;
    
    const message = `SQL Query${duration ? ` (${duration}ms)` : ''}`;
    const context = { query, params };
    
    console.log(formatMessage(LOG_LEVELS.DEBUG, message, context));
};

module.exports.LOG_LEVELS = LOG_LEVELS;
