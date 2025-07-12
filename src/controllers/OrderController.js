const orderModel = require('../models/OrderModel');
const cartModel = require('../models/CartModel');
const db = require('../config/db');

const checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.body;

    const cart = await cartModel.getOrCreateCart(userId);
    const cartItems = await cartModel.getCartItems(cart.id);

    if (!cartItems.length) {
      return res.status(400).json({ message: 'Carrinho está vazio' });
    }

    // Calcula o total
    const totalPrice = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Cria a encomenda (status inicial: pendente)
    const order = await orderModel.createOrder(userId, addressId, totalPrice);

    for (const item of cartItems) {
      await orderModel.addOrderItem(order.id, item.product_id, item.quantity, item.price);
    }

    // Limpa carrinho
    await orderModel.clearCart(cart.id);

    res.status(201).json({ message: 'Encomenda realizada com sucesso', orderId: order.id });

  } catch (err) {
    console.error('Erro no checkout:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};


const listUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderModel.getOrdersByUser(userId);

    // Se orders for resultado da query do pg:
    return res.json(orders.rows); // Só envia os dados
  } catch (err) {
    console.error('Erro ao listar encomendas:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};



module.exports = {
  checkout,
  listUserOrders
};
