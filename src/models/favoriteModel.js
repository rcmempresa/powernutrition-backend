// src/models/favoriteModel.js
const db = require('../config/db');

const addFavoriteVariant = async (userId, variantId) => {
  const query = `
    INSERT INTO user_favorites (user_id, variant_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, variant_id) DO NOTHING
    RETURNING *;
  `;
  const values = [userId, variantId];
  try {
    const result = await db.query(query, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Erro no modelo ao adicionar favorito:', error);
    throw error;
  }
};

const removeFavoriteVariant = async (userId, variantId) => {
  try {
    const result = await db.query(
      `DELETE FROM user_favorites
       WHERE user_id = $1 AND variant_id = $2
       RETURNING *`,
      [userId, variantId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Erro no modelo ao remover favorito:', error);
    throw error;
  }
};

const getFavoriteProductsByUserId = async (userId) => {
  try {
    const result = await db.query(
      `SELECT
          p.id AS product_id,
          p.name AS product_name,
          p.description,
          p.image_url,
          p.original_price,
          uf.variant_id,
          v.preco,
          v.weight_value,
          v.weight_unit,
          uf.created_at AS favorited_at,
          b.name AS brand_name,
          c.name AS category_name,
          fl.name AS flavor_name
       FROM user_favorites uf
       JOIN variantes v ON uf.variant_id = v.id
       JOIN products p ON v.produto_id = p.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN flavors fl ON v.sabor_id = fl.id
       WHERE uf.user_id = $1
       ORDER BY uf.created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro no modelo ao obter favoritos do utilizador:', error);
    throw error;
  }
};

module.exports = {
  addFavoriteVariant,
  removeFavoriteVariant,
  getFavoriteProductsByUserId,
};