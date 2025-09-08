// models/CartModel.js
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

// ✨ Adiciona ou atualiza um item no carrinho com base no variant_id
const addItemToCart = async (cartId, variantId, quantity, price) => {
  const existing = await db.query(
    'SELECT * FROM cart_items WHERE cart_id = $1 AND variant_id = $2', // Usar variant_id
    [cartId, variantId]
  );

  if (existing.rows.length > 0) {
    const updated = await db.query(
      `UPDATE cart_items
       SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
       WHERE cart_id = $2 AND variant_id = $3
       RETURNING *`, // Usar variant_id
      [quantity, cartId, variantId]
    );
    return updated.rows[0];
  }

  const inserted = await db.query(
    `INSERT INTO cart_items (cart_id, variant_id, quantity, price)
     VALUES ($1, $2, $3, $4)
     RETURNING *`, // Usar variant_id
    [cartId, variantId, quantity, price]
  );
  return inserted.rows[0];
};



const getCartItems = async (cartId) => {
  const result = await db.query(
    `SELECT
        ci.*,
        v.id AS variant_id,
        v.sabor_id,
        v.weight_value,
        v.weight_unit,
        v.sku,
        p.id AS product_id,      
        p.name AS product_name,
        p.description AS product_description,
        p.image_url AS product_image,
        b.name AS brand_name,
        f.name AS flavor_name
     FROM cart_items ci
     JOIN variantes v ON ci.variant_id = v.id
     JOIN products p ON v.produto_id = p.id
     JOIN brands b ON p.brand_id = b.id
     JOIN flavors f ON v.sabor_id = f.id  
     WHERE ci.cart_id = $1`,
    [cartId]
  );
  return result.rows;
};
// ✨ Atualiza a quantidade do item com base no variant_id
const updateItemQuantity = async (cartId, variantId, quantity) => {
    console.log('➡️ A atualizar item do carrinho:', { cartId, variantId, quantity });
  const result = await db.query(
    `UPDATE cart_items 
     SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE cart_id = $2 AND variant_id = $3 
     RETURNING *`, // Usar variant_id
    [quantity, cartId, variantId]
  );

  return result.rows[0];
};

// ✨ Remove o item do carrinho com base no variant_id
const removeItemFromCart = async (cartId, variantId) => {
  const result = await db.query(
    `DELETE FROM cart_items WHERE cart_id = $1 AND variant_id = $2 RETURNING *`, // Usar variant_id
    [cartId, variantId]
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
  findCartByUserId,
};