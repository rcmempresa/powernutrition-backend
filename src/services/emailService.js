const SibApiV3Sdk = require('@getbrevo/brevo');
require('dotenv').config();

// 1. Get the default API client instance
const defaultClient = SibApiV3Sdk.ApiClient.instance;

// 2. Set the API key on the default client instance
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

// 3. Initialize the TransactionalEmailsApi
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// --- Centralized Email Sending Function ---
/**
 * Sends a transactional email using the Brevo API.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The email subject.
 * @param {string} htmlContent - The email content in HTML format.
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
    
    // Create the email payload
    const sendSmtpEmail = {
      sender,
      to: receivers,
      subject,
      htmlContent,
    };
    
    // Send the email
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log(`Email successfully sent to ${to}!`);
  } catch (error) {
    console.error(`Error sending email:`, error.body);
    throw error;
  }
};

module.exports = {
  sendEmail,
};