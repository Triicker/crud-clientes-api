/**
 * Utilitário para padronização de respostas da API
 * Garante que todas as respostas sigam o formato: { success, data?, message?, details? }
 */

/**
 * Formata resposta de sucesso
 * @param {any} data - Dados a serem retornados
 * @param {string} message - Mensagem opcional de sucesso
 * @returns {Object} Objeto padronizado de resposta
 */
exports.success = (data, message = 'Operação realizada com sucesso') => {
    return {
        success: true,
        data,
        message
    };
};

/**
 * Formata resposta de erro
 * @param {string} message - Mensagem de erro
 * @param {any} details - Detalhes adicionais do erro (opcional)
 * @returns {Object} Objeto padronizado de erro
 */
exports.error = (message, details = null) => {
    const response = {
        success: false,
        message
    };
    
    if (details) {
        response.details = details;
    }
    
    return response;
};

/**
 * Formata resposta de validação (erro 400)
 * @param {string} message - Mensagem de validação
 * @param {Object} errors - Objeto com erros de validação por campo
 * @returns {Object} Objeto padronizado de erro de validação
 */
exports.validationError = (message = 'Erro de validação', errors = {}) => {
    return {
        success: false,
        message,
        errors
    };
};

/**
 * Formata resposta de não autorizado (401)
 * @param {string} message - Mensagem de erro de autenticação
 * @returns {Object} Objeto padronizado de erro
 */
exports.unauthorized = (message = 'Não autorizado') => {
    return {
        success: false,
        message
    };
};

/**
 * Formata resposta de proibido (403)
 * @param {string} message - Mensagem de erro de permissão
 * @returns {Object} Objeto padronizado de erro
 */
exports.forbidden = (message = 'Acesso negado') => {
    return {
        success: false,
        message
    };
};

/**
 * Formata resposta de não encontrado (404)
 * @param {string} resource - Nome do recurso não encontrado
 * @returns {Object} Objeto padronizado de erro
 */
exports.notFound = (resource = 'Recurso') => {
    return {
        success: false,
        message: `${resource} não encontrado`
    };
};

/**
 * Formata resposta de lista paginada
 * @param {Array} data - Array de itens
 * @param {Object} pagination - Informações de paginação { page, limit, total }
 * @param {string} message - Mensagem opcional
 * @returns {Object} Objeto padronizado com paginação
 */
exports.paginated = (data, pagination, message = 'Lista recuperada com sucesso') => {
    return {
        success: true,
        data,
        pagination: {
            page: pagination.page || 1,
            limit: pagination.limit || 10,
            total: pagination.total || 0,
            totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 10))
        },
        message
    };
};
