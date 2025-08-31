const db = require('../config/db');

const listProducts = async () => {
  const result = await db.query(
    `SELECT
      p.*, -- Seleciona todas as colunas da tabela products (p)
      c.name AS category_name, -- Alias para o nome da categoria
      f.name AS flavor_name -- Alias para o nome do sabor
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN flavors f ON p.flavor_id = f.id
    WHERE p.is_active = true
    ORDER BY p.created_at DESC`
  );
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
    weight_unit, weight_value, flavor_id,
    stock_ginasio 
  } = productData;

  const result = await db.query(
    `INSERT INTO products (
      name, description, price, original_price, stock_quantity,
      sku, image_url, category_id, brand,
      weight_unit, weight_value, flavor_id,
      stock_ginasio -- ✨ Adicionado aqui na lista de colunas! ✨
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *`,
    [
      name, description, price, original_price, stock_quantity,
      sku, image_url, category_id, brand,
      weight_unit, weight_value, flavor_id,
      stock_ginasio 
    ]
  );
  return result.rows[0];
};

const updateProduct = async (id, productData) => {
  const {
    name, description, price, original_price, stock_quantity,
    sku, image_url, category_id, brand,
    weight_unit, weight_value, flavor_id, is_active,
    stock_ginasio 
  } = productData;

  const result = await db.query(
    `UPDATE products SET
      name = $1, description = $2, price = $3, original_price = $4, stock_quantity = $5,
      sku = $6, image_url = $7, category_id = $8, brand = $9,
      weight_unit = $10, weight_value = $11, flavor_id = $12, is_active = $13,
      stock_ginasio = $14, 
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $15  
    RETURNING *`,
    [
      name, description, price, original_price, stock_quantity,
      sku, image_url, category_id, brand,
      weight_unit, weight_value, flavor_id, is_active,
      stock_ginasio, 
      id 
    ]
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

const decrementStock = async (productId, quantity) => {
  const result = await db.query(
    `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND stock_quantity >= $1`,
    [quantity, productId]
  );

  if (result.rowCount === 0) {
    throw new Error(`Não foi possível atualizar o stock do produto com ID ${productId}`);
  }
};

const decrementStockGinasio = async (productId, quantity) => {
  const result = await db.query(
    `UPDATE products SET stock_ginasio = stock_ginasio - $1 WHERE id = $2 AND stock_ginasio >= $1`,
    [quantity, productId]
  );

  if (result.rowCount === 0) {
    throw new Error(`Não foi possível atualizar o stock do ginásio para o produto com ID ${productId}`);
  }
};

module.exports = {
  listProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  findProductByName,
  findProductBySku,
  decrementStock,
  decrementStockGinasio
};
