const nodemailer = require('nodemailer');
require('dotenv').config();

// --- Transporter para E-mails do Proprietário (Ex: Notificações de Nova Encomenda) ---
// Usa um serviço genérico, como o Gmail, para comunicações internas.
const transporterGmail = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// --- Transporter para E-mails de Confirmação (Ex: Clientes) ---
// Ideal para comunicações de alto volume, como registos e encomendas.
const transporterConfirmacao = nodemailer.createTransport({
  host: 'webdomain03.dnscpanel.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.CONFIRMATION_EMAIL_USER,
    pass: process.env.CONFIRMATION_EMAIL_PASS,
  },
});

// --- Função Centralizada para Enviar E-mails ---
/**
 * Envia um e-mail usando o transportador apropriado.
 * @param {string} to - Endereço de e-mail do destinatário.
 * @param {string} subject - Assunto do e-mail.
 * @param {string} htmlContent - Conteúdo do e-mail em formato HTML.
 * @param {'confirmacao'|'proprietario'} [type='confirmacao'] - Tipo de e-mail a enviar.
 */
const sendEmail = async (to, subject, htmlContent, type = 'confirmacao') => {
  try {
    let transporter;
    let fromEmail;

    // Seleciona o transportador e o e-mail de origem com base no tipo
    if (type === 'proprietario') {
      transporter = transporterGmail;
      fromEmail = process.env.GMAIL_USER;
    } else { // 'confirmacao' por padrão
      transporter = transporterConfirmacao;
      fromEmail = process.env.CONFIRMATION_EMAIL_USER;
    }

    const mailOptions = {
      from: `"RD Power" <${fromEmail}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`E-mail de tipo '${type}' enviado com sucesso para ${to}!`);
  } catch (error) {
    console.error(`Erro ao enviar e-mail de tipo '${type}':`, error);
    throw error; // Propaga o erro para ser tratado pela rota que chamou a função
  }
};

module.exports = {
  sendEmail,
};