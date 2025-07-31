const db = require('../config/db');

const listAllOrders = async() =>{
  const result = await db.query(
    `SELECT id, user_id, address_id, total_price, status,created_at, updated_at FROM orders ORDER BY created_at DESC`
  );
  return result.rows;
}

const updateOrder = async (orderId, updateData) => {
  const fields = Object.keys(updateData);
  const values = Object.values(updateData);

  if (fields.length === 0) return null;

  const setClause = fields.map((field, idx) => `${field} = $${idx + 1}`).join(', ');

  const query = `
    UPDATE orders
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${fields.length + 1}
    RETURNING *;
  `;

  const result = await db.query(query, [...values, orderId]);
  return result.rows[0];
};

const deleteOrder = async (orderId) => {
  // Eliminar os items primeiro
  await db.query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);

  // Só depois eliminar a encomenda
  const result = await db.query(`DELETE FROM orders WHERE id = $1 RETURNING *`, [orderId]);

  return result.rows[0];
};

const createOrder = async (userId, addressId, totalPrice, paymentMethod = 'pendente', couponCode = null) => {
  const result = await db.query(
    `INSERT INTO orders (user_id, address_id, total_price, status, coupon_code)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, addressId, totalPrice, paymentMethod, couponCode]
  );
  return result.rows[0];
};


const addOrderItem = async (orderId, productId, quantity, price) => {
  await db.query(
    `INSERT INTO order_items (order_id, product_id, quantity, price)
     VALUES ($1, $2, $3, $4)`,
    [orderId, productId, quantity, price]
  );
};

const listUserOrders = async (userId) => {
  const result = await db.query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

const getOrderById = async (orderId) => {
  const result = await db.query(
    `SELECT * FROM orders WHERE id = $1`,
    [orderId]
  );
  return result.rows[0];
};

const clearCart = async (cartId) => {
  await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
};

const getOrdersByUser = async (userId) => {
  const result = await db.query('SELECT * FROM orders WHERE user_id = $1', [userId]);
  return result;  // o objeto completo do pg com várias props
}

module.exports = {
  createOrder,
  addOrderItem,
  listUserOrders,
  getOrderById,
  clearCart,
  getOrdersByUser,
  listAllOrders,
  updateOrder,
  deleteOrder
};
