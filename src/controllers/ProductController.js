const productModel = require('../models/ProductModel');

const listProducts = async (req, res) => {
  try {
    const products = await productModel.listProducts();
    res.json(products);
  } catch (err) {
    console.error('Erro ao listar produtos:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

/*const getProductById = async (req, res) => {
  try {
    const product = await productModel.findProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json(product);
  } catch (err) {
    console.error('Erro ao buscar produto:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};*/

const getProductById = async (req, res) => {
  try {
    const { id } = req.params; 
   
    const product = await productModel.getProductDetails(id);
    
    
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }
    res.json(product);
    
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, sku } = req.body;

    // Verificar nome
    const existingName = await productModel.findProductByName(name);
    if (existingName) return res.status(400).json({ message: 'Já existe um produto com esse nome' });

    // Verificar sku
    const existingSku = await productModel.findProductBySku(sku);
    if (existingSku) return res.status(400).json({ message: 'Já existe um produto com esse SKU' });

    const product = await productModel.createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ message: 'Erro interno ao criar produto' });
  }
};

const createProductAndVariant = async (req, res) => {
  try {
    const { product, variant } = req.body;

    // ✨ Validação do nome do produto no controlador
    const existingName = await productModel.findProductByName(product.name);
    if (existingName) {
      return res.status(400).json({ message: 'Já existe um produto com esse nome.' });
    }

    // ✨ Validação do SKU da variante no controlador
    const existingSku = await productModel.findProductBySku(variant.sku);
    if (existingSku) {
        return res.status(400).json({ message: 'Já existe uma variante com esse SKU.' });
    }

    // Chama a função do modelo, agora que os dados estão validados
    const newProduct = await productModel.createProductAndVariant(req.body);

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Erro ao criar produto e variante:', error);
    res.status(500).json({ message: 'Erro interno ao criar produto.' });
  }
};


const addVariantToProduct = async (req, res) => {
  try {
    const { productId } = req.params; // Recebe o ID do produto da URL
    const { variant } = req.body;
    
    // A validação do SKU é feita no model
    const newVariant = await productModel.addVariantToProduct(productId, variant);

    res.status(201).json(newVariant);
  } catch (error) {
    console.error('Erro ao adicionar variante:', error);
    res.status(500).json({ message: 'Erro interno ao adicionar variante' });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const productData = req.body;

  try {
    // 1. Validar a entrada (opcional, mas recomendado)
    if (!productData || Object.keys(productData).length === 0) {
      return res.status(400).json({ message: 'Dados de atualização do produto não fornecidos.' });
    }

    // 2. Tentar encontrar o produto no banco de dados.
    const product = await productModel.findProductById(id); 
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    // 3. Atualizar os campos do produto
    await product.update(productData);

    return res.status(200).json({ message: 'Produto atualizado com sucesso.', product });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao atualizar o produto.' });
  }
};

const updateVariant = async (req, res) => {
  const { productId, variantId } = req.params;
  const variantData = req.body;

  try {
    // 1. Validar a entrada
    if (!variantData || Object.keys(variantData).length === 0) {
      return res.status(400).json({ message: 'Dados de atualização da variante não fornecidos.' });
    }

    // 2. Encontrar a variante no banco de dados.
    // Você precisa de uma lógica para garantir que a variante pertence ao produto correto.
    const variant = await productModel.findVariantById({ 
      where: {
        id: variantId,
        produto_id: productId, // Crucial para a segurança
      },
    });

    if (!variant) {
      return res.status(404).json({ message: 'Variante não encontrada para este produto.' });
    }

    // 3. Atualizar os campos da variante.
    await variant.update(variantData);

    return res.status(200).json({ message: 'Variante atualizada com sucesso.', variant });
  } catch (error) {
    console.error('Erro ao atualizar variante:', error);
    return res.status(500).json({ message: 'Erro interno do servidor ao atualizar a variante.' });
  }
};


const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await productModel.deleteProduct(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json({ message: 'Produto desativado com sucesso' });
  } catch (err) {
    console.error('Erro ao desativar produto:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductAndVariant,
  addVariantToProduct,
  updateVariant
};
