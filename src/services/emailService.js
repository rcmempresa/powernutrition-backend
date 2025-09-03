const SibApiV3Sdk = require('@getbrevo/brevo');
require('dotenv').config();

// Initialize the API client
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Set the API key
const apiKey = apiInstance.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// --- Centralized Email Sending Function ---
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
    
    console.log(`Email successfully sent to ${to}!`);
  } catch (error) {
    console.error(`Error sending email:`, error.body);
    throw error;
  }
};

module.exports = {
  sendEmail,
};