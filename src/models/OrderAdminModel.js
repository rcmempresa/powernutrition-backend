const db = require('../config/db');

const listAllOrders = async () => {
  const result = await db.query(`
    SELECT * FROM orders ORDER BY created_at DESC
  `);
  return result.rows;
};

const findOrderById = async (id) => {
  const result = await db.query(`
    SELECT o.*, a.address_line1, a.city, a.postal_code
    FROM orders o
    LEFT JOIN addresses a ON o.address_id = a.id
    WHERE o.id = $1
  `, [id]);
  return result.rows[0];
};

const updateOrder = async (id, data) => {
  // Construir query dinamicamente para atualizar campos que existam no `data`
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key in data) {
    fields.push(`${key} = $${idx}`);
    values.push(data[key]);
    idx++;
  }
  values.push(id);

  const query = `
    UPDATE orders SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${idx}
    RETURNING *
  `;

  const result = await db.query(query, values);
  return result.rows[0];
};

const deleteOrder = async (id) => {
  const result = await db.query(`
    DELETE FROM orders WHERE id = $1 RETURNING *
  `, [id]);
  return result.rows[0];
};

module.exports = {
  listAllOrders,
  findOrderById,
  updateOrder,
  deleteOrder
};
