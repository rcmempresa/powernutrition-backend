const db = require('../config/db');

const listProducts = async () => {
  const result = await db.query('SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC');
  return result.rows;
};

const findProductById = async (id) => {
  const result = await db.query('SELECT * FROM products WHERE id = $1 AND is_active = true', [id]);
  return result.rows[0];
};

const findProductByName = async (name) => {
  const result = await db.query('SELECT * FROM products WHERE name = $1', [name]);
  return result.rows[0];
};

const findProductBySku = async (sku) => {
  const result = await db.query('SELECT * FROM products WHERE sku = $1', [sku]);
  return result.rows[0];
};



const createProduct = async (productData) => {
  const {
    name, description, price, original_price, stock_quantity,
    sku, image_url, category_id, brand,
    weight_unit, weight_value, flavor_id
  } = productData;

  const result = await db.query(
    `INSERT INTO products (
      name, description, price, original_price, stock_quantity,
      sku, image_url, category_id, brand,
      weight_unit, weight_value, flavor_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,
    [name, description, price, original_price, stock_quantity, sku, image_url, category_id, brand, weight_unit, weight_value, flavor_id]
  );
  return result.rows[0];
};

const updateProduct = async (id, productData) => {
  const {
    name, description, price, original_price, stock_quantity,
    sku, image_url, category_id, brand,
    weight_unit, weight_value, flavor_id, is_active
  } = productData;

  const result = await db.query(
    `UPDATE products SET
      name = $1, description = $2, price = $3, original_price = $4, stock_quantity = $5,
      sku = $6, image_url = $7, category_id = $8, brand = $9,
      weight_unit = $10, weight_value = $11, flavor_id = $12, is_active = $13,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $14
    RETURNING *`,
    [name, description, price, original_price, stock_quantity, sku, image_url, category_id, brand, weight_unit, weight_value, flavor_id, is_active, id]
  );
  return result.rows[0];
};

const deleteProduct = async (id) => {
  // Soft delete: marca is_active = false
  const result = await db.query(
    `UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

module.exports = {
  listProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  findProductByName,
  findProductBySku
};
