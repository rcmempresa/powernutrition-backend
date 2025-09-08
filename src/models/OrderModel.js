const db = require('../config/db');

const listAllOrders = async() =>{
  const result = await db.query(
    `SELECT
      o.id,
      o.user_id,
      u.username, -- Seleciona o nome de utilizador da tabela 'users'
      o.address_id,
      a.address_line1, -- NOVO: Seleciona o address_line1 da tabela 'addresses'
      o.total_price,
      o.status,
      o.easypay_id, -- NOVO: Seleciona o easypay_id da tabela 'orders'
      o.created_at,
      o.updated_at
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id -- Faz um LEFT JOIN para obter os dados do utilizador
    LEFT JOIN addresses a ON o.address_id = a.id -- NOVO: Faz um LEFT JOIN para obter os dados da morada
    ORDER BY o.created_at DESC`
  );
  return result.rows;
};

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

const createOrder = async (userId, addressId, totalPrice, status, couponCode, paymentMethod, easypayId) => {
  const result = await db.query(
    `INSERT INTO orders (user_id, address_id, total_price, status, coupon_code, payment_method, easypay_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, addressId, totalPrice, status, couponCode, paymentMethod, easypayId]
  );
  return result.rows[0];
};


const addOrderItem = async (orderId, variantId, quantity, price) => {
  await db.query(
    // ✨ ALTERADO: A query SQL para usar a coluna variant_id
    `INSERT INTO order_items (order_id, variant_id, quantity, price)
     VALUES ($1, $2, $3, $4)`,
    // ✨ ALTERADO: Os parâmetros da query
    [orderId, variantId, quantity, price]
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
  // Query principal para a encomenda, utilizador e morada
  const orderResult = await db.query(
    `SELECT
      o.id,
      o.user_id,
      u.username,
      u.email as user_email,
      o.address_id,
      a.address_line1,
      a.address_line2,
      a.city,
      a.state_province,
      a.postal_code,
      a.country,
      o.total_price,
      o.status,
      o.payment_method,
      o.easypay_id,
      o.coupon_code,
      o.created_at,
      o.updated_at
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN addresses a ON o.address_id = a.id
    WHERE o.id = $1`,
    [orderId]
  );
  const order = orderResult.rows[0];

  if (order) {
    // 1. Corrigido: Usamos a query que faz JOIN com 'variantes' e 'products'
    const itemsResult = await db.query(
      `SELECT
        oi.variant_id,
        p.name AS product_name,
        p.image_url,
        oi.quantity,
        oi.price AS item_price
      FROM order_items oi
      JOIN variantes v ON oi.variant_id = v.id  -- Primeiro JOIN com a tabela de variantes
      JOIN products p ON v.produto_id = p.id  -- Segundo JOIN para obter os detalhes do produto
      WHERE oi.order_id = $1`,
      [orderId]
    );
    order.items = itemsResult.rows; // Adiciona os itens como uma propriedade do objeto encomenda
  }
  return order; // Retorna a encomenda com todos os detalhes e os seus itens
};
const clearCart = async (cartId) => {
  await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
};

const getOrdersByUser = async (userId) => {
  const result = await db.query('SELECT * FROM orders WHERE user_id = $1', [userId]);
  return result; 
}

const findOrdersWithItemsByUserId = async (userId) => {
  const query = `
    SELECT
      o.id,
      o.total_price,
      o.created_at,
      o.status,
      o.payment_method,
      json_agg(
        json_build_object(
          'id', oi.id,
          'product_name', p.name,
          'flavor_name', f.name,             -- ✨ ADICIONADO: Nome do sabor
          'quantity', oi.quantity,
          'price', oi.price
        )
      ) AS order_items
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN variantes v ON oi.variant_id = v.id   -- ✨ ADICIONADO: Liga aos dados da variante
    JOIN products p ON v.produto_id = p.id
    JOIN flavors f ON v.sabor_id = f.id      -- ✨ ADICIONADO: Liga aos dados do sabor
    WHERE o.user_id = $1
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;

  try {
    const result = await db.query(query, [userId]);
    return result.rows; 
  } catch (error) {
    console.error('Erro ao buscar encomendas com detalhes:', error);
    throw error;
  }
};

const updatePaymentStatus = async (orderId, newStatus) => {
    try {
        const result = await db.query(
            "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
            [newStatus, orderId]
        );
        
        if (result.rowCount === 0) {
            return null;
        }
        return result.rows[0];
    } catch (error) {
        console.error("Erro ao atualizar o status de pagamento:", error);
        throw error;
    }
};

const getOrderByEasyPayReference = async (easypayReference) => {
  const result = await db.query(
    `SELECT * FROM orders WHERE payment_details->>'reference' = $1`,
    [easypayReference]
  );
  return result.rows[0];
};

const getOrderByEasyPayId = async (easypayId) => {
  const result = await db.query(
    `SELECT * FROM orders WHERE easypay_id = $1`,
    [easypayId]
  );
  return result.rows[0];
};


const getOrderItems = async (orderId) => {
  const result = await db.query(
    `SELECT 
      oi.product_id,  
      oi.quantity,
      oi.price,
      p.name,
      p.image_url
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = $1`,
    [orderId]
  );
  return result.rows;
};

module.exports = {
  createOrder,
  addOrderItem,
  listUserOrders,
  getOrderById,
  clearCart,
  getOrdersByUser,
  listAllOrders,
  updateOrder,
  deleteOrder,
  updatePaymentStatus,
  getOrderByEasyPayReference,
  getOrderByEasyPayId,
  getOrderItems,
  findOrdersWithItemsByUserId
};
