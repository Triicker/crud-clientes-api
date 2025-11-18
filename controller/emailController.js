const { createTransport } = require('../config/email');
const emailQueue = require('../utils/emailQueue');

// Inicializa o transporter/queue na primeira carga
if (!emailQueue.transporter) {
  try {
    const transporter = createTransport();
    emailQueue.init(transporter);
    console.log('✉️  Fila de e-mail inicializada');
  } catch (err) {
    console.error('Erro ao inicializar transporte de e-mail:', err);
  }
}

function parseRecipients(toRaw) {
  if (!toRaw) return [];
  return String(toRaw)
    .split(/[;,]/)
    .map(s => s.trim())
    .filter(Boolean);
}

exports.enqueueEmail = async (req, res) => {
  try {
    const { to, subject, html, text, cc, bcc, from } = req.body || {};
    const recipients = parseRecipients(to);
    if (!recipients.length) {
      return res.status(400).json({ error: 'Campo "to" é obrigatório' });
    }

    // Preparar anexos a partir do multer (buffer em memória)
    const attachments = (req.files || []).map(f => ({
      filename: f.originalname,
      content: f.buffer,
      contentType: f.mimetype,
    }));

    const jobs = [];
    recipients.forEach((rcpt) => {
      const id = emailQueue.add({
        from,
        to: rcpt,
        cc,
        bcc,
        subject,
        html,
        text,
        attachments,
      });
      jobs.push(id);
    });

    return res.status(202).json({
      message: 'E-mails enfileirados',
      queued: jobs.length,
      job_ids: jobs,
    });
  } catch (err) {
    console.error('Erro no enqueueEmail:', err);
    return res.status(500).json({ error: 'Falha ao enfileirar e-mails' });
  }
};
 
