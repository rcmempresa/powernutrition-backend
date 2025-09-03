const Brevo = require('@getbrevo/brevo');
require('dotenv').config();

// Inicializa a API do Brevo usando o método 'ApiClient.instance'
const defaultClient = Brevo.ApiClient.instance;

// Define a autenticação usando a sua chave de API
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

// Inicializa a API de E-mails Transacionais
const apiInstance = new Brevo.TransactionalEmailsApi();

// --- Função Centralizada para Enviar E-mails ---
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const sender = {
      email: process.env.CONFIRMATION_EMAIL_USER,
      name: 'RD Power',
    };

    const receivers = [{
      email: to,
    }];
    
    await apiInstance.sendTransacEmail({
      sender,
      to: receivers,
      subject,
      htmlContent,
    });
    
    console.log(`E-mail enviado com sucesso para ${to}!`);
  } catch (error) {
    console.error(`Erro ao enviar e-mail:`, error.body);
    throw error;
  }
};

module.exports = {
  sendEmail,
};