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

    // Adicionado console.log para inspecionar os dados de 'items'
    console.log("Dados recebidos no 'items':", items);

    if (!couponCode) {
        return res.status(400).json({ message: 'O código do cupão é obrigatório.' });
    }

    try {
        const coupon = await CouponModel.getCouponByCode(couponCode);

        if (!coupon) {
            return res.status(404).json({ message: 'O cupão não é válido ou expirou.' });
        }
        
        let discountApplied = 0;
        let eligibleItemFound = false;

        // Itera sobre todos os itens do carrinho para encontrar o primeiro item elegível
        for (const item of items) {
            console.log("A processar o item:", item);
            // A sua regra: o cupão só se aplica se o item não tiver original_price
            if (item.original_price === null || item.original_price === undefined) {
                // Produto elegível encontrado!
                eligibleItemFound = true;
                
                // Conversão do valor do desconto de string para número
                const discountValue = parseFloat(coupon.discount_percentage);

                if (isNaN(discountValue)) {
                    console.error('Erro: discount_percentage não é um número válido.');
                    return res.status(500).json({ message: 'Erro interno ao calcular o desconto.' });
                }

                // Calcular o desconto com base no preço do item elegível
                discountApplied = item.price * (discountValue / 100);
                
                // Parar o loop assim que o primeiro item elegível for encontrado
                break;
            }
        }

        // Se nenhum item elegível foi encontrado, o cupão não pode ser aplicado
        if (!eligibleItemFound) {
             return res.status(400).json({
                message: 'Este cupão só se aplica a produtos sem desconto pré-existente.'
             });
        }
        
        // Recalcular o total do carrinho com o desconto
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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