const db = require('../config/db');

const ProductImageModel = {
  addImage: async (productId, imageUrl) => {
    const result = await db.query(
      `INSERT INTO product_images (product_id, image_url) VALUES ($1, $2) RETURNING *`,
      [productId, imageUrl]
    );
    return result.rows[0];
  },

  getImagesByProduct: async (productId) => {
    const result = await db.query(
      `SELECT * FROM product_images WHERE product_id = $1`,
      [productId]
    );
    return result.rows;
  },

  deleteImage: async (imageId) => {
    await db.query(
      `DELETE FROM product_images WHERE id = $1`,
      [imageId]
    );
  }
};

module.exports = ProductImageModel;
