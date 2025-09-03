const SibApiV3Sdk = require('@getbrevo/brevo');
require('dotenv').config();

// Inicializa a API do Brevo
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Define a chave de API diretamente na instância da API
apiInstance.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

// --- Função Centralizada para Enviar E-mails ---
/**
 * Envia um e-mail transacional usando a API do Brevo.
 * @param {string} to - O endereço de e-mail do destinatário.
 * @param {string} subject - O assunto do e-mail.
 * @param {string} htmlContent - O conteúdo do e-mail em formato HTML.
 */
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const sender = {
      email: process.env.CONFIRMATION_EMAIL_USER,
      name: 'RD Power',
    };

    const receivers = [{
      email: to,
    }];
    
    // Cria o payload do e-mail
    const sendSmtpEmail = {
      sender,
      to: receivers,
      subject,
      htmlContent,
    };
    
    // Envia o e-mail
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log(`E-mail enviado com sucesso para ${to}!`);
  } catch (error) {
    console.error(`Erro ao enviar e-mail:`, error.body);
    throw error;
  }
};

module.exports = {
  sendEmail,
};