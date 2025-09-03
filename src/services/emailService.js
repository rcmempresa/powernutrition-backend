const { Resend } = require('resend');
require('dotenv').config();

// Inicializa o cliente do Resend com a sua chave de API
// Certifique-se de adicionar RESEND_API_KEY no .env local e no Railway
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Função Centralizada para Enviar E-mails ---
/**
 * Envia um e-mail usando o Resend.
 * @param {string} to - Endereço de e-mail do destinatário.
 * @param {string} subject - Assunto do e-mail.
 * @param {string} htmlContent - Conteúdo do e-mail em formato HTML.
 */
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const fromEmail = process.env.CONFIRMATION_EMAIL_USER;

    // Use a API do Resend para enviar o e-mail
    const { data } = await resend.emails.send({
      from: `"RD Power" <${fromEmail}>`,
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    console.log(`E-mail enviado com sucesso para ${to}!`, data);
  } catch (error) {
    console.error(`Erro ao enviar e-mail:`, error);
    throw error;
  }
};

module.exports = {
  sendEmail,
};