const CouponModel = require('../models/CouponModel');

const createCoupon = async (req, res) => {
  try {
    const newCoupon = await CouponModel.createCoupon(req.body);
    res.status(201).json(newCoupon);
  } catch (err) {
    console.error('Erro ao criar cupão:', err);
    res.status(500).json({ message: 'Erro ao criar cupão' });
  }
};

const getCouponByCode = async (req, res) => {
  try {
    const coupon = await CouponModel.getCouponByCode(req.params.code);
    if (!coupon) {
      return res.status(404).json({ message: 'Cupão não encontrado ou inativo' });
    }
    res.json(coupon);
  } catch (err) {
    console.error('Erro ao buscar cupão:', err);
    res.status(500).json({ message: 'Erro ao buscar cupão' });
  }
};

const countCouponUsage = async (req, res) => {
  try {
    const count = await CouponModel.countOrdersWithCoupon(req.params.code);
    res.json({ code: req.params.code, usage_count: count });
  } catch (err) {
    console.error('Erro ao contar uso do cupão:', err);
    res.status(500).json({ message: 'Erro ao contar uso do cupão' });
  }
};

const listCoupons = async (req, res) => {
  try {
    const coupons = await CouponModel.listCoupons();
    res.json(coupons);
  } catch (err) {
    console.error('Erro ao listar cupões:', err);
    res.status(500).json({ message: 'Erro ao listar cupões' });
  }
};

const applyCoupon = async (req, res) => {
    const { couponCode, items } = req.body;

    if (!couponCode) {
        return res.status(400).json({ message: 'O código do cupão é obrigatório.' });
    }

    try {
        const coupon = await CouponModel.getCouponByCode(couponCode);

        if (!coupon) {
            return res.status(404).json({ message: 'O cupão não é válido ou expirou.' });
        }

        // Calcular o subtotal do carrinho
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        let discountApplied = 0;
        
        // Conversão do valor do desconto de string para número
        const discountValue = parseFloat(coupon.discount_percentage);

        // Verificar se a conversão foi bem-sucedida e se o valor é válido
        if (!isNaN(discountValue)) {
            // Calcular o desconto com base no valor numérico
            discountApplied = subtotal * (discountValue / 100);
        } else {
            console.error('Erro: discount_percentage não é um número válido.');
            return res.status(500).json({ message: 'Erro interno ao calcular o desconto.' });
        }

        let newTotal = subtotal - discountApplied;
        if (newTotal < 0) {
            newTotal = 0;
        }

        res.status(200).json({
            message: 'Cupão aplicado com sucesso!',
            discount: discountApplied,
            newTotal: newTotal
        });

    } catch (err) {
        console.error('Erro ao aplicar o cupão:', err);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

// **NOVA FUNÇÃO: Atualizar Cupão**
const updateCoupon = async (req, res) => {
  try {
    const updatedCoupon = await CouponModel.updateCoupon(req.params.id, req.body);
    if (!updatedCoupon) {
      return res.status(404).json({ message: 'Cupão não encontrado.' });
    }
    res.json(updatedCoupon);
  } catch (err) {
    console.error('Erro ao atualizar cupão:', err);
    res.status(500).json({ message: 'Erro ao atualizar cupão.' });
  }
};

// **NOVA FUNÇÃO: Eliminar Cupão**
const deleteCoupon = async (req, res) => {
  try {
    const deletedCount = await CouponModel.deleteCoupon(req.params.id);
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Cupão não encontrado.' });
    }
    res.status(204).send(); // Envia status "No Content" para indicar sucesso na eliminação
  } catch (err) {
    console.error('Erro ao eliminar cupão:', err);
    res.status(500).json({ message: 'Erro ao eliminar cupão.' });
  }
};


module.exports = {
  createCoupon,
  getCouponByCode,
  countCouponUsage,
  listCoupons,
  applyCoupon,
  updateCoupon,
  deleteCoupon,
};