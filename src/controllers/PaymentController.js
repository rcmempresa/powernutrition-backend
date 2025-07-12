const PaymentModel = require('../models/PaymentModel');

const createPayment = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const payment = await PaymentModel.createPayment(orderId, req.body);
    res.status(201).json(payment);
  } catch (err) {
    console.error('Erro ao criar pagamento:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

const getPaymentByOrderId = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const payment = await PaymentModel.getPaymentByOrderId(orderId);
    if (!payment) {
      return res.status(404).json({ message: 'Pagamento não encontrado' });
    }
    res.json(payment);
  } catch (err) {
    console.error('Erro ao buscar pagamento:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

module.exports = { createPayment, getPaymentByOrderId };
