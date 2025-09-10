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
    // 💡 CORRIGIDO: Agora, desestruturamos o objeto recebido do frontend.
    // Ele contém as propriedades do produto e uma matriz de variantes.
    const { variants, ...productData } = req.body;

    // ✨ Validação do nome do produto
    const existingName = await productModel.findProductByName(productData.name);
    if (existingName) {
      return res.status(400).json({ message: 'Já existe um produto com esse nome.' });
    }

    // ✨ Validação dos SKUs das variantes (iterando sobre a lista)
    for (const variant of variants) {
        const existingSku = await productModel.findProductBySku(variant.sku);
        if (existingSku) {
            return res.status(400).json({ message: `Já existe uma variante com o SKU: ${variant.sku}.` });
        }
    }

    // Chama a função do modelo, passando os dados do produto e as variantes separadamente
    const newProduct = await productModel.createProductWithVariants(productData, variants);

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
  try {
    const updatedProduct = await productModel.updateProduct(req.params.id, req.body);
    if (!updatedProduct) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json(updatedProduct);
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
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
  addVariantToProduct
};
