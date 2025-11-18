class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.counter = 1;
    this.transporter = null;
    this.defaultFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'no-reply@example.com';
  }

  init(transporter) {
    this.transporter = transporter;
  }

  add(job) {
    const id = this.counter++;
    const wrapped = { id, ...job };
    this.queue.push(wrapped);
    this._process();
    return id;
  }

  async _process() {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      try {
        const mailOptions = {
          from: job.from || this.defaultFrom,
          to: job.to,
          cc: job.cc,
          bcc: job.bcc,
          subject: job.subject || '',
          text: job.text,
          html: job.html,
          attachments: job.attachments || [],
        };
        await this.transporter.sendMail(mailOptions);
        if (job.onSuccess) job.onSuccess(job.id);
      } catch (err) {
        console.error('❌ Erro ao enviar e-mail na fila:', err);
        if (job.onError) job.onError(job.id, err);
      }
    }
    this.processing = false;
  }
}

module.exports = new EmailQueue();
