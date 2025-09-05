// O seu CartController já estava a usar o productModel, mas vamos garantir que ele tem a função correta
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

// ✨ addToCart corrigido para usar variant_id
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { variant_id, quantity } = req.body;

    if (!variant_id || !quantity || quantity <= 0) {
      // Mensagem de erro mais precisa
      return res.status(400).json({ message: 'variant_id e quantity válidos são obrigatórios' });
    }

    // Buscar a variante para obter o preço
    // Assumimos que a sua productModel tem uma nova função `findVariantById`
    const variant = await productModel.findVariantById(variant_id);
    if (!variant) {
      return res.status(404).json({ message: 'Variante não encontrada' });
    }

    const price = variant.preco;

    let cart = await cartModel.findCartByUserId(userId);
    if (!cart) {
      cart = await cartModel.createCart(userId);
    }

    const cartItem = await cartModel.addItemToCart(cart.id, variant_id, quantity, price);

    res.status(201).json({ message: 'Produto adicionado ao carrinho', cartItem });
  } catch (err) {
    console.error('Erro ao adicionar ao carrinho:', err);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// ✨ updateQuantity corrigido para usar variantId
const updateQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    // O nome da variável agora corresponde à rota
    const { variantId, quantity } = req.body;
    const cart = await cartModel.getOrCreateCart(userId);
    const item = await cartModel.updateItemQuantity(cart.id, variantId, quantity);
    res.json(item);
  } catch (err) {
    console.error('Erro ao atualizar quantidade:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

// ✨ removeFromCart corrigido para usar variantId
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { variantId } = req.params;
    const cart = await cartModel.getOrCreateCart(userId);
    const deleted = await cartModel.removeItemFromCart(cart.id, variantId);
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