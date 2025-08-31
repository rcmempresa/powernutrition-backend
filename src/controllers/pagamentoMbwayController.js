const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
require('dotenv').config();


const sendPaymentEmail = async (to, paymentData) => {
  const transporterGmail = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
  from: '"Nrenergias" <no-reply@nrnergias.pt>',
  to: to,
  subject: 'Dados para pagamento - MBWay',
  text: `Olá ${paymentData.customer_name || ''},\n\nAcabámos de enviar uma notificação MBWay para o seu telemóvel. Por favor, confirme a notificação para processar o pagamento com sucesso.\n\nObrigado pela sua compra!`,
  html: `
    <p>Olá ${paymentData.customer_name || ''},</p>
    <p>Acabámos de enviar uma notificação MBWay para o seu telemóvel. Por favor, confirme a notificação para processar o pagamento com sucesso.</p>
    <p>Obrigado pela sua compra!</p>
  `,
};


  await transporterGmail.sendMail(mailOptions);
};


const handleCheckout = async (req, res) => {
  try {
    // Recebe os dados do cliente e da transação do corpo da requisição
    const { customer, key, value, capture } = req.body;

    // Monta o corpo da requisição para a EasyPay
    const body = {
      currency: 'EUR',
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        phone_indicative: customer.phone_indicative
      },
      key,
      value,
      type: 'sale', 
      method: 'mbw', 
      capture
    };

    // Faz a requisição para a API EasyPay (ambiente de testes ou produção)
    const response = await fetch('https://api.test.easypay.pt/2.0/single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AccountId: '4fd3b7b4-f8eb-4465-9b07-88ad9096b5de',
        ApiKey: '3087ac59-b8cd-4f6e-bb5f-f4d99ee83629'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({ error: errorData });
    }

    const data = await response.json();
    
    const paymentData = {
      customer_name: customer.name,
    };
    //await sendPaymentEmail(customer.email, paymentData);
    res.json(data);

  } catch (error) {
    console.error('Erro ao criar referência MB WAY:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

module.exports = { handleCheckout };

