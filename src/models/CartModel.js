const db = require('../config/db');

// Cria ou obtém o carrinho do utilizador
const getOrCreateCart = async (userId) => {
  const existing = await db.query('SELECT * FROM carts WHERE user_id = $1', [userId]);
  if (existing.rows.length > 0) return existing.rows[0];

  const created = await db.query(
    'INSERT INTO carts (user_id) VALUES ($1) RETURNING *',
    [userId]
  );
  return created.rows[0];
};

// Adiciona ou atualiza um item no carrinho
const addItemToCart = async (cartId, productId, quantity, price) => {
  const existing = await db.query(
    'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
    [cartId, productId]
  );

  if (existing.rows.length > 0) {
    const updated = await db.query(
      `UPDATE cart_items
       SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
       WHERE cart_id = $2 AND product_id = $3
       RETURNING *`,
      [quantity, cartId, productId]
    );
    return updated.rows[0];
  }

  const inserted = await db.query(
    `INSERT INTO cart_items (cart_id, product_id, quantity, price)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [cartId, productId, quantity, price]
  );
  return inserted.rows[0];
};

const getCartItems = async (cartId) => {
  const result = await db.query(
    `SELECT ci.*, p.name, p.image_url
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = $1`,
    [cartId]
  );
  return result.rows;
};

const updateItemQuantity = async (cartId, productId, quantity) => {
    console.log('➡️ A atualizar item do carrinho:', { cartId, productId, quantity });
  const result = await db.query(
    `UPDATE cart_items 
     SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE cart_id = $2 AND product_id = $3 
     RETURNING *`,
    [quantity, cartId, productId]
  );

  return result.rows[0];
};


const removeItemFromCart = async (cartId, productId) => {
  const result = await db.query(
    `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2 RETURNING *`,
    [cartId, productId]
  );
  return result.rows[0];
};

const findCartByUserId = async (userId) => {
  const result = await db.query(
    'SELECT * FROM carts WHERE user_id = $1',
    [userId]
  );
  return result.rows[0]; 
};

module.exports = {
  getOrCreateCart,
  addItemToCart,
  getCartItems,
  updateItemQuantity,
  removeItemFromCart,
  findCartByUserId
};
