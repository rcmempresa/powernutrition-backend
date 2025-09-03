const { Resend } = require('resend');
require('dotenv').config();

// Inicializa o cliente do Resend com a sua chave de API
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Função Centralizada para Enviar E-mails ---
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const { data } = await resend.emails.send({
      from: 'RD Power <o-seu-email-verificado>', // Use um e-mail verificado no Resend
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    console.log('E-mail enviado com sucesso:', data);
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
  }
};

module.exports = {
  sendEmail,
};