const { Resend } = require('resend');
require('dotenv').config();

// Inicialize o cliente do Resend com a sua chave de API
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Função Centralizada para Enviar E-mails ---
/**
 * Envia um e-mail usando o Resend.
 * @param {string} to - Endereço de e-mail do destinatário.
 * @param {string} subject - Assunto do e-mail.
 * @param {string} htmlContent - Conteúdo do e-mail em formato HTML.
 * @param {'confirmacao'|'proprietario'} [type='confirmacao'] - Tipo de e-mail a enviar.
 */
const sendEmail = async (to, subject, htmlContent, type = 'confirmacao') => {
  try {
    const fromEmail = 'RD Power <geral@1way.pt>'; // O seu e-mail verificado no Resend
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: to,
      subject: subject,
      html: htmlContent,
    });
    
    if (error) {
        console.error('Erro ao enviar e-mail:', error);
        throw error;
    }
    
    console.log(`E-mail de tipo '${type}' enviado com sucesso para ${to}!`);
  } catch (error) {
    console.error(`Erro ao enviar e-mail de tipo '${type}':`, error);
    throw error;
  }
};

module.exports = {
  sendEmail,
};