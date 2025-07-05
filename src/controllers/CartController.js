const cartModel = require('../models/CartModel');
const productModel = require('../models/ProductModel');

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartModel.getOrCreateCart(userId);
    const items = await cartModel.getCartItems(cart.id);
    res.json({ cartId: cart.id, items });
  } catch (err) {
    console.error('Erro ao obter carrinho:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

// CartController.js

const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'product_id e quantity válidos são obrigatórios' });
    }

    // Buscar o produto para obter o preço atual
    const product = await productModel.findProductById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    const price = product.price;

    // Garantir que o carrinho do utilizador existe ou criar um novo
    let cart = await cartModel.findCartByUserId(userId);
    if (!cart) {
      cart = await cartModel.createCart(userId);
    }

    // Adicionar o item ao carrinho (ou atualizar quantidade se já existir)
    const cartItem = await cartModel.addItemToCart(cart.id, product_id, quantity, price);

    res.status(201).json({ message: 'Produto adicionado ao carrinho', cartItem });
  } catch (err) {
    console.error('Erro ao adicionar ao carrinho:', err);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};


const updateQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;
    const cart = await cartModel.getOrCreateCart(userId);
    const item = await cartModel.updateItemQuantity(cart.id, productId, quantity);
    res.json(item);
  } catch (err) {
    console.error('Erro ao atualizar quantidade:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const cart = await cartModel.getOrCreateCart(userId);
    const deleted = await cartModel.removeItemFromCart(cart.id, productId);
    res.json(deleted);
  } catch (err) {
    console.error('Erro ao remover item:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart
};
