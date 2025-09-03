const Sib = require('@getbrevo/brevo');
require('dotenv').config();

const brevoClient = new Sib.ApiClient();
brevoClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const transactionalEmailsApi = new Sib.TransactionalEmailsApi();

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const sender = {
      email: process.env.CONFIRMATION_EMAIL_USER,
      name: 'RD Power',
    };

    const receivers = [{
      email: to,
    }];
    
    await transactionalEmailsApi.sendTransacEmail({
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