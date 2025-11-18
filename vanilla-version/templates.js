// Templates de mensagens padrão (WhatsApp e E-mail)
// Você pode ajustar este arquivo para customizar os modelos.

window.messageTemplates = {
  whatsapp: [
    {
      id: 'whats_apresentacao',
      name: 'Apresentação Comercial',
      text: 'Olá {{nome}}, tudo bem? Sou da Ética Sistemas. Gostaria de apresentar uma solução para sua instituição. Podemos falar?'
    },
    {
      id: 'whats_followup',
      name: 'Follow-up Proposta',
      text: 'Olá {{nome}}, passando para confirmar se recebeu nossa proposta e se posso ajudar com alguma dúvida.'
    }
  ],
  email: [
    {
      id: 'email_apresentacao',
      name: 'Apresentação Comercial',
      subject: 'Apresentação Ética Sistemas',
      html: '<p>Olá {{nome}},</p><p>Sou da Ética Sistemas e temos soluções para apoiar a gestão da sua instituição. Posso compartilhar mais detalhes?</p><p>Att,<br/>Equipe Ética Sistemas</p>'
    },
    {
      id: 'email_followup',
      name: 'Follow-up Proposta',
      subject: 'Você conseguiu avaliar nossa proposta?',
      html: '<p>Olá {{nome}},</p><p>Conseguiu avaliar a proposta que enviamos? Fico à disposição para ajustar o que for necessário.</p><p>Att,<br/>Equipe Ética Sistemas</p>'
    }
  ]
};
