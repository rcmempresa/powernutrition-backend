const orderModel = require('../models/OrderModel');

const listAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.listAllOrders();
    res.json(orders);
  } catch (err) {
    console.error('Erro ao listar todas as encomendas:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orderModel.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Encomenda não encontrada' });
    }
    res.json(order);
  } catch (err) {
    console.error('Erro ao obter encomenda:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

const updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const updateData = req.body; // ex: { status: 'enviado', total_price: 150 }
    const updatedOrder = await orderModel.updateOrder(orderId, updateData);
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Encomenda não encontrada' });
    }
    res.json(updatedOrder);
  } catch (err) {
    console.error('Erro ao atualizar encomenda:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const deletedOrder = await orderModel.deleteOrder(orderId);
    if (!deletedOrder) {
      return res.status(404).json({ message: 'Encomenda não encontrada' });
    }
    res.json({ message: 'Encomenda eliminada com sucesso' });
  } catch (err) {
    console.error('Erro ao eliminar encomenda:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

module.exports = {
  listAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder
};
