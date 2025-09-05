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
const addFavoriteVariant = async (userId, productId) => {
  const query = `
    INSERT INTO user_favorites (user_id, product_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, product_id) DO NOTHING
    RETURNING *;
  `;
  const values = [userId, productId];

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
    const result = await db.query(
      `SELECT
          p.id AS product_id,
          p.name AS product_name,
          p.description,
          p.image_url,
          p.original_price,
          b.name AS brand_name,
          c.name AS category_name,
          v.id AS variant_id,
          v.preco,
          v.weight_value,
          v.weight_unit,
          fl.name AS flavor_name,
          uf.created_at AS favorited_at
       FROM user_favorites uf
       JOIN products p ON uf.product_id = p.id
       JOIN variantes v ON p.id = v.produto_id -- ✨ JOIN para a tabela de variantes
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN flavors fl ON v.sabor_id = fl.id
       WHERE uf.user_id = $1
       ORDER BY uf.created_at DESC`,
      [userId]
    );

    // ✨ Agrupar as variantes por produto
    const productsMap = new Map();
    result.rows.forEach(row => {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.description,
          image_url: row.image_url,
          original_price: row.original_price,
          brand_name: row.brand_name,
          category_name: row.category_name,
          variants: []
        });
      }
      productsMap.get(row.product_id).variants.push({
        id: row.variant_id,
        preco: row.preco,
        weight_value: row.weight_value,
        weight_unit: row.weight_unit,
        flavor_name: row.flavor_name,
      });
    });

    return Array.from(productsMap.values());
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
  addFavoriteVariant
};
