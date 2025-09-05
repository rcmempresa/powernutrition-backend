const db = require('../config/db');

/*const listProducts = async () => {
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
};*/

const listProducts = async () => {
  try {
    const query = `
      SELECT
        p.*,
        c.name AS category_name,
        b.name AS brand_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', v.id,
              'produto_id', v.produto_id,
              'sabor_id', v.sabor_id,
              'weight_value', v.weight_value,
              'weight_unit', v.weight_unit,
              'preco', v.preco,
              'quantidade_em_stock', v.quantidade_em_stock,
              'stock_ginasio', v.stock_ginasio,
              'sku', v.sku,
              'flavor_name', f.name  -- AQUI ESTÁ A CORREÇÃO FINAL
            )
          ) FILTER (WHERE v.id IS NOT NULL),
          '[]'
        ) AS variants
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN variantes v ON p.id = v.produto_id
      LEFT JOIN flavors f ON v.sabor_id = f.id
      WHERE p.is_active = true
      GROUP BY p.id, c.name, b.name
      ORDER BY p.created_at DESC;
    `;
    const result = await db.query(query);
    return result.rows;
  } catch (err) {
    console.error('Erro no modelo ao listar produtos:', err);
    throw err;
  }
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
  const result = await db.query('SELECT * FROM variantes WHERE sku = $1', [sku]);
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


const createProductAndVariant = async (data) => {
  const { product, variant } = data;
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const existingSku = await client.query('SELECT sku FROM variantes WHERE sku = $1', [variant.sku]);
    if (existingSku.rows.length > 0) {
      await client.query('ROLLBACK');
      throw new Error('Já existe uma variante com esse SKU.');
    }


    const productResult = await client.query(
      `INSERT INTO products (
        name, description, brand_id, image_url, category_id, original_price
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        product.name,
        product.description,
        product.brand_id,
        product.image_url,
        product.category_id,
        product.original_price, 
      ]
    );

    const newProductId = productResult.rows[0].id;

    const variantResult = await client.query(
      `INSERT INTO variantes (
        produto_id, sabor_id, weight_value, weight_unit, preco,
        quantidade_em_stock, stock_ginasio, sku
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        newProductId,
        variant.sabor_id,
        variant.weight_value,
        variant.weight_unit,
        variant.preco,
        variant.quantidade_em_stock,
        variant.stock_ginasio,
        variant.sku,
      ]
    );

    await client.query('COMMIT');
    return { product: productResult.rows[0], variant: variantResult.rows[0] };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};


const addVariantToProduct = async (productId, variantData) => {
  const { sabor_id, weight_value, weight_unit, preco, quantidade_em_stock, stock_ginasio, sku } = variantData;

  const client = await db.connect();

  try {
    // Verificar se o SKU já existe
    const existingSku = await client.query('SELECT sku FROM variantes WHERE sku = $1', [sku]);
    if (existingSku.rows.length > 0) {
      throw new Error('Já existe uma variante com esse SKU.');
    }

    // Inserir a nova variante
    const result = await client.query(
      `INSERT INTO variantes (
        produto_id, sabor_id, weight_value, weight_unit, preco,
        quantidade_em_stock, stock_ginasio, sku
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        productId,
        sabor_id,
        weight_value,
        weight_unit,
        preco,
        quantidade_em_stock,
        stock_ginasio,
        sku,
      ]
    );

    return result.rows[0];
  } catch (error) {
    throw error;
  } finally {
    client.release();
  }
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


const getProductDetails = async (productId) => {
  const client = await db.connect();

  try {
    // 1. Obter os detalhes do produto principal
    const productResult = await client.query(
      `SELECT
        p.*,
        c.name AS category_name,
        b.name AS brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id  -- Assumindo que tem uma tabela de marcas
      WHERE p.id = $1`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return null; // Produto não encontrado
    }
    const product = productResult.rows[0];

    // 2. Obter todas as variantes associadas a este produto
    const variantsResult = await client.query(
      `SELECT
        v.*,
        f.name AS flavor_name
      FROM variantes v
      LEFT JOIN flavors f ON v.sabor_id = f.id
      WHERE v.produto_id = $1
      ORDER BY v.weight_value ASC`, // 💡 CORRIGIDO AQUI!
      [productId]
    );
    
    // Devolve o produto principal com uma lista das suas variantes
    return {
      ...product,
      variants: variantsResult.rows
    };

  } catch (error) {
    throw error;
  } finally {
    client.release();
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
  decrementStockGinasio,
  createProductAndVariant,
  addVariantToProduct,
  getProductDetails
};
