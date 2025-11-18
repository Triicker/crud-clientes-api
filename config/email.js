const nodemailer = require('nodemailer');

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Se não estiver configurado, usa transporte simulado (jsonTransport) para não enviar de verdade
  if (!host || !user || !pass) {
    console.warn('⚠️ SMTP não configurado completamente. Usando transporte simulado (jsonTransport).');
    return nodemailer.createTransport({ jsonTransport: true });
  }

  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

  return transporter;
}

module.exports = {
  createTransport,
};
