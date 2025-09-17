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
    const { couponCodes, items } = req.body;
    
    // Verificação inicial
    if (!couponCodes || !Array.isArray(couponCodes) || couponCodes.length === 0) {
        return res.status(400).json({ message: 'A lista de cupões é obrigatória.' });
    }

    try {
        let totalDiscount = 0;
        let eligibleItemFound = false;

        // Cria uma cópia dos itens para rastrear quais já receberam desconto.
        // Isso evita que um mesmo item receba mais de um desconto.
        const discountedItems = new Set(); 

        for (const couponCode of couponCodes) {
            const coupon = await CouponModel.getCouponByCode(couponCode);

            if (!coupon) {
                return res.status(404).json({ message: `O cupão "${couponCode}" não é válido ou expirou.` });
            }

            const discountValue = parseFloat(coupon.discount_percentage);

            const eligibleItemsForCoupon = items.filter(item => {
                // Se o item já foi descontado por um cupão anterior, ignora.
                if (discountedItems.has(item.id)) {
                    return false;
                }

                // Lógica para cupões gerais
                if (!coupon.is_specific) {
                    // Aplica-se apenas a produtos que não têm um preço original (sem desconto pré-existente)
                    return item.original_price === null;
                } 
                // Lógica para cupões específicos
                else {
                    // Aplica-se apenas ao produto com o ID associado
                    return item.product_id === coupon.product_id;
                }
            });

            if (eligibleItemsForCoupon.length > 0) {
                const currentCouponDiscount = eligibleItemsForCoupon.reduce((sum, item) => {
                    // O desconto é sempre aplicado sobre o preço atual do item no carrinho
                    const priceForDiscount = item.price;
                    
                    // Marca o item como descontado
                    discountedItems.add(item.id);

                    return sum + (priceForDiscount * item.quantity * (discountValue / 100));
                }, 0);

                totalDiscount += currentCouponDiscount;
                eligibleItemFound = true;
            }
        }

        if (!eligibleItemFound) {
            return res.status(400).json({
                message: 'Nenhum cupão se aplica a um produto elegível no seu carrinho.'
            });
        }

        // Recalcula o total final
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let newTotal = subtotal - totalDiscount;

        if (newTotal < 0) {
            newTotal = 0;
        }

        res.status(200).json({
            message: 'Cupões aplicados com sucesso!',
            discount: totalDiscount,
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