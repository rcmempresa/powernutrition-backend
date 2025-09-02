const nodemailer = require('nodemailer');
require('dotenv').config();

// --- Transporter para E-mails de Confirmação (Brevo) ---
const transporterBrevo = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // TLS is used, not SSL. A porta 587 usa STARTTLS
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

// --- Função Centralizada para Enviar E-mails ---
const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: `"RD Power" <geral@1way.pt>`, // Use um e-mail verificado no Brevo
      to: to,
      subject: subject,
      html: htmlContent,
    };
    
    // Agora, o Nodemailer usa o transporter do Brevo para enviar o e-mail
    await transporterBrevo.sendMail(mailOptions);
    console.log(`E-mail de confirmação enviado com sucesso para ${to}!`);
  } catch (error) {
    console.error(`Erro ao enviar e-mail:`, error);
    throw error;
  }
};

module.exports = {
  sendEmail,
};