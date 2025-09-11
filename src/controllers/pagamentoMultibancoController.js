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
    subject: 'Dados para pagamento - Multibanco',
    text: `Olá ${paymentData.customer_name || ''},\n\nSegue abaixo a referência Multibanco para pagamento:\nEntidade: ${paymentData.entity}\nReferência: ${paymentData.reference}\nValor: ${paymentData.value}€\n\nObrigado pela sua compra!`,
    html: `
      <p>Olá ${paymentData.customer_name || ''},</p>
      <p>Aqui está a sua referência Multibanco:</p>
      <ul>
        <li><strong>Entidade:</strong> ${paymentData.entity}</li>
        <li><strong>Referência:</strong> ${paymentData.reference}</li>
        <li><strong>Valor:</strong> ${Number(paymentData.value).toFixed(2)}€</li>
      </ul>
      <p>Obrigado pela sua compra!</p>
    `,
  };

  await transporterGmail.sendMail(mailOptions);
};

const handleCheckout = async (req, res) => {
  try {
    const { customer, key, value, method, capture } = req.body;

    // Adicione esta validação para garantir que os dados essenciais estão presentes
    if (!customer || !customer.name || !customer.email || !key || !value || !capture || !capture.descriptive) {
      console.error('Erro: Dados da requisição incompletos ou ausentes.');
      return res.status(400).json({ error: 'Dados da requisição incompletos ou inválidos.' });
    }

    // A requisição 'fetch' agora usa todos os campos fornecidos no body.
    const response = await fetch('https://api.prod.easypay.pt/2.0/single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AccountId: 'd9a0e96e-7385-4f0a-b58b-1e934340c4ef',
        ApiKey: '9cf00848-31d3-4357-80b1-a4b7f31007b0'
      },
      body: JSON.stringify({
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          phone_indicative: customer.phone_indicative,
          key: customer.key,
        },
        key,
        value,
        method: 'mb',
        capture: {
          descriptive: capture.descriptive,
          transaction_key: capture.transaction_key,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Resposta de erro da Easypay:', errorData);
      return res.status(response.status).json({ error: errorData });
    }

    const data = await response.json();
    console.log('Resposta de sucesso da Easypay:', data);

    const paymentData = {
      customer_name: customer.name,
      entity: data.method.entity,
      reference: data.method.reference,
      value: value,
    };
    //await sendPaymentEmail(customer.email, paymentData);

    res.json(data);
  } catch (error) {
    console.error('Erro ao criar referência Multibanco:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

module.exports = {
  handleCheckout,
  sendPaymentEmail,
};
