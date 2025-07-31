const orderModel = require('../models/OrderModel');
const cartModel = require('../models/CartModel');
const couponModel = require('../models/CouponModel');
const productModel = require('../models/ProductModel');
const db = require('../config/db');

const checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId, couponCode } = req.body;

    const cart = await cartModel.getOrCreateCart(userId);
    const cartItems = await cartModel.getCartItems(cart.id);

    if (!cartItems.length) {
      return res.status(400).json({ message: 'Carrinho está vazio' });
    }

    // Verificar stock de cada produto
    for (const item of cartItems) {
      const product = await productModel.findProductById(item.product_id);

      if (!product) {
        return res.status(404).json({ message: `Produto com ID ${item.product_id} não encontrado` });
      }

      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Stock insuficiente para o produto "${product.name}". Disponível: ${product.stock_quantity}` 
        });
      }
    }

    // Calcular total
    let totalPrice = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Verificar e aplicar cupão
    let discount = 0;
    if (couponCode) {
      const coupon = await couponModel.getCouponByCode(couponCode);
      if (coupon && coupon.is_active) {
        if (coupon.discount_percentage) {
          discount = totalPrice * (coupon.discount_percentage / 100);
        } else if (coupon.discount_amount) {
          discount = coupon.discount_amount;
        }
        totalPrice -= discount;
        if (totalPrice < 0) totalPrice = 0;
      } else {
        return res.status(400).json({ message: 'Cupão inválido ou inativo' });
      }
    }

    // Criar encomenda
    const order = await orderModel.createOrder(userId, addressId, totalPrice, 'pendente', couponCode || null);

    // Adicionar produtos à encomenda e atualizar stock
    for (const item of cartItems) {
      await orderModel.addOrderItem(order.id, item.product_id, item.quantity, item.price);
      await productModel.decrementStock(item.product_id, item.quantity);
    }

    // Limpar carrinho
    await orderModel.clearCart(cart.id);

    res.status(201).json({ 
      message: 'Encomenda realizada com sucesso', 
      orderId: order.id,
      discountApplied: discount
    });

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
