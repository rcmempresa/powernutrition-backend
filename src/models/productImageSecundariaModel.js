// src/models/productImageModel.js
const pool = require('../config/db'); 

const ProductImage = {
  // Função para buscar todas as imagens de um produto pelo seu ID
  async getImagesByProductId(productId) {
    try {
      const result = await pool.query(
        'SELECT id, product_id, image_url, is_primary, created_at, updated_at FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, created_at ASC',
        [productId]
      );
      return result.rows;
    } catch (err) {
      console.error('Erro ao buscar imagens do produto:', err);
      throw err;
    }
  },

  // Função para criar uma nova imagem de produto
  async create(product_id, image_url, is_primary = false) {
    try {
      const result = await pool.query(
        'INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, $3) RETURNING *',
        [product_id, image_url, is_primary]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Erro ao criar imagem do produto:', err);
      throw err;
    }
  },

  // Função para atualizar uma imagem existente (por exemplo, trocar a URL ou o status de primário)
  async update(id, image_url, is_primary) {
    try {
      const result = await pool.query(
        'UPDATE product_images SET image_url = $1, is_primary = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [image_url, is_primary, id]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Erro ao atualizar imagem do produto:', err);
      throw err;
    }
  },

  // Função para deletar uma imagem pelo seu ID
  async delete(id) {
    try {
      const result = await pool.query('DELETE FROM product_images WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (err) {
      console.error('Erro ao deletar imagem do produto:', err);
      throw err;
    }
  },

  // Função para definir uma imagem como primária, garantindo que as outras se tornem secundárias
  async setPrimary(id, product_id) {
    try {
      // Começa uma transação para garantir que ambas as operações sejam atômicas
      await pool.query('BEGIN');
      
      // 1. Define todas as imagens do produto como secundárias
      await pool.query(
        'UPDATE product_images SET is_primary = FALSE WHERE product_id = $1',
        [product_id]
      );

      // 2. Define a imagem selecionada como primária
      const result = await pool.query(
        'UPDATE product_images SET is_primary = TRUE, updated_at = NOW() WHERE id = $1 AND product_id = $2 RETURNING *',
        [id, product_id]
      );

      await pool.query('COMMIT');
      return result.rows[0];

    } catch (err) {
      await pool.query('ROLLBACK');
      console.error('Erro ao definir imagem como primária:', err);
      throw err;
    }
  }
};

module.exports = ProductImage;