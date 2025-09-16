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
    // Agora, esperamos uma array de códigos de cupão e os itens do carrinho.
    const { couponCodes, items } = req.body;
    
    console.log("Dados recebidos no 'items':", items);

    // Verificação inicial: garante que a lista de cupões não está vazia.
    if (!couponCodes || !Array.isArray(couponCodes) || couponCodes.length === 0) {
        return res.status(400).json({ message: 'A lista de cupões é obrigatória.' });
    }

    try {
        let totalDiscount = 0;
        let eligibleItemFound = false;

        // Itera sobre CADA código de cupão enviado pelo frontend.
        for (const couponCode of couponCodes) {
            const coupon = await CouponModel.getCouponByCode(couponCode);

            if (!coupon) {
                // Se um cupão for inválido, podemos abortar e enviar um erro.
                return res.status(404).json({ message: `O cupão "${couponCode}" não é válido ou expirou.` });
            }

            const discountValue = parseFloat(coupon.discount_percentage);

            // Determina quais itens do carrinho são elegíveis para este cupão.
            const eligibleItems = items.filter(item => {
                // Lógica para cupões gerais (ex: 10%)
                if (!coupon.is_specific) {
                    // O cupão geral aplica-se apenas a produtos que não têm um preço original (sem desconto pré-existente)
                    return item.original_price === null || item.original_price === undefined;
                } 
                // Lógica para cupões específicos (ex: 25%)
                else {
                    // O cupão específico aplica-se apenas ao produto com o ID associado
                    return item.product_id === coupon.product_id;
                }
            });

            // Se o cupão se aplica a algum item, calculamos o desconto.
            if (eligibleItems.length > 0) {
                // Aplica o desconto para este cupão nos itens elegíveis.
                const currentCouponDiscount = eligibleItems.reduce((sum, item) => {
                    // A nova lógica: usa o original_price para cupões específicos, caso contrário usa o price
                    const priceForDiscount = (coupon.is_specific && item.original_price != null)
                        ? item.original_price
                        : item.price;
                        
                    return sum + (priceForDiscount * item.quantity * (discountValue / 100));
                }, 0);

                // Soma o desconto deste cupão ao total acumulado.
                totalDiscount += currentCouponDiscount;
                
                // Marca que pelo menos um item elegível foi encontrado.
                eligibleItemFound = true;
            }
        }

        // Se nenhum item foi elegível após verificar todos os cupões, envia um erro.
        if (!eligibleItemFound) {
            return res.status(400).json({
                message: 'Nenhum cupão se aplica a um produto elegível no seu carrinho.'
            });
        }

        // Recalcula o total final com base no subtotal e no total de descontos.
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