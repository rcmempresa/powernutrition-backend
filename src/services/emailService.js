const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const fromEmail = process.env.CONFIRMATION_EMAIL_USER;

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