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

// Função para remover um produto dos favoritos de um utilizador
const removeFavoriteProduct = async (userId, productId) => {
  try {
    const result = await db.query(
      `DELETE FROM user_favorites
       WHERE user_id = $1 AND product_id = $2
       RETURNING *`, // Retorna o registo eliminado
      [userId, productId]
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
const getFavoriteProductsByUserId = async (userId) => {
  try {
    // Junta com a tabela de produtos para obter todos os detalhes dos produtos favoritos
    const result = await db.query(
      `SELECT
          p.id,
          p.name,
          p.description,
          p.price,
          p.stock_quantity,
          p.sku,
          p.image_url,
          p.category_id,
          c.name AS category_name, -- Nome da categoria
          p.brand,
          p.weight_unit,
          p.weight_value,
          p.is_active,
          p.created_at,
          p.updated_at,
          p.flavor_id,
          f.name AS flavor_name, -- Nome do sabor
          p.original_price,
          p.stock_ginasio,
          p.rating,
          p.reviewcount,
          uf.created_at AS favorited_at -- Quando foi adicionado aos favoritos
       FROM user_favorites uf
       JOIN products p ON uf.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN flavors f ON p.flavor_id = f.id
       WHERE uf.user_id = $1
       ORDER BY uf.created_at DESC`, // Ordena pelos mais recentemente adicionados
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro no modelo ao obter produtos favoritos do utilizador:', error);
    throw error;
  }
};

module.exports = {
  addFavoriteProduct,
  removeFavoriteProduct,
  getFavoriteProductsByUserId,
  isProductFavorite,
};
