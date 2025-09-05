// src/models/favoriteModel.js
const db = require('../config/db'); 

// Função para adicionar um produto aos favoritos de um utilizador
const addFavoriteProduct = async (userId, productId) => {
  try {
    const result = await db.query(
      `INSERT INTO user_favorites (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING *`, // Retorna o registo inserido se não houver conflito
      [userId, productId]
    );
    // Retorna o primeiro registo inserido (se houver), ou null se já existia (ON CONFLICT DO NOTHING)
    return result.rows[0]; 
  } catch (error) {
    console.error('Erro no modelo ao adicionar produto aos favoritos:', error);
    throw error;
  }
};

// A função agora usa product_id e insere na tabela user_favorites
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
    const addedFavorite = result.rows[0];

    return addedFavorite || null; 
    
  } catch (error) {
    console.error('Erro no modelo ao adicionar favorito:', error);
    throw error;
  }
};

// Função para remover um produto dos favoritos de um utilizador
const removeFavoriteProduct = async (userId, variantId) => {
  try {
    const result = await db.query(
      `DELETE FROM user_favorites
       WHERE user_id = $1 AND variant_id = $2
       RETURNING *`, // Retorna o registo eliminado
      [userId, variantId]
    );
    // Retorna o primeiro registo eliminado (se houver)
    return result.rows[0];
  } catch (error) {
    console.error('Erro no modelo ao remover produto dos favoritos:', error);
    throw error;
  }
};
// Função para verificar se um produto está nos favoritos de um utilizador
const isProductFavorite = async (userId, productId) => {
  try {
    const result = await db.query(
      `SELECT 1 FROM user_favorites
       WHERE user_id = $1 AND product_id = $2`,
      [userId, productId]
    );
    // Retorna true se encontrar um registo, false caso contrário
    return result.rows.length > 0;
  } catch (error) {
    console.error('Erro no modelo ao verificar se produto é favorito:', error);
    throw error;
  }
};


// Função para listar todos os produtos favoritos de um utilizador
// src/models/favoriteModel.js

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
       JOIN products p ON v.produto_id = p.id  -- ✨ Alterado de p.product_id para p.produto_id
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
  addFavoriteProduct,
  removeFavoriteProduct,
  getFavoriteProductsByUserId,
  isProductFavorite,
  addFavoriteVariant
};
