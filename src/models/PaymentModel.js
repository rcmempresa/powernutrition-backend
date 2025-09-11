const db = require('../config/db');

const PaymentModel = {
  createPayment: async (orderId, paymentData) => {
    const {
      payment_method,
      amount,
      payment_status = 'pendente',
      payment_reference
    } = paymentData;

    const result = await db.query(
      `INSERT INTO payments (order_id, payment_method, amount, payment_status, payment_reference)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orderId, payment_method, amount, payment_status, payment_reference]
    );

    return result.rows[0];
  },

  getPaymentByOrderId: async (orderId) => {
    const result = await db.query(
      `SELECT * FROM payments WHERE order_id = $1`,
      [orderId]
    );
    return result.rows[0];
  }
};

module.exports = PaymentModel;
