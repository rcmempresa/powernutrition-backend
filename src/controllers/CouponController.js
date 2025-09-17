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
    
    // Log 1: Verifica o payload inicial recebido do frontend
    console.log('--- Início da execução da função applyCoupon ---');
    console.log('Payload recebido:', { couponCodes, items });

    // Verificação inicial
    if (!couponCodes || !Array.isArray(couponCodes) || couponCodes.length === 0) {
        console.log('Erro: Lista de cupões vazia.');
        return res.status(400).json({ message: 'A lista de cupões é obrigatória.' });
    }

    try {
        let totalDiscount = 0;
        let eligibleItemFound = false;

        // Rastrea os itens que já foram descontados para evitar descontos duplos
        const discountedItemIds = new Set(); 

        for (const couponCode of couponCodes) {
            console.log(`\n--- Processando cupão: "${couponCode}" ---`);
            const coupon = await CouponModel.getCouponByCode(couponCode);

            if (!coupon) {
                console.log(`Erro: Cupão "${couponCode}" não é válido ou expirou.`);
                return res.status(404).json({ message: `O cupão "${couponCode}" não é válido ou expirou.` });
            }

            // Log 2: Verifica os dados do cupão do banco de dados
            console.log('Dados do cupão:', coupon);

            const discountValue = parseFloat(coupon.discount_percentage);

            const eligibleItemsForCoupon = items.filter(item => {
                if (discountedItemIds.has(item.id)) {
                    return false;
                }

                if (!coupon.is_specific) {
                    return item.original_price === null || item.original_price === undefined;
                } 
                else {
                    return item.product_id === coupon.product_id;
                }
            });

            // Log 3: Mostra quais itens são elegíveis para este cupão
            console.log('Itens elegíveis para este cupão:', eligibleItemsForCoupon.map(item => item.product_name));

            if (eligibleItemsForCoupon.length > 0) {
                const currentCouponDiscount = eligibleItemsForCoupon.reduce((sum, item) => {
                    const priceForDiscount = (item.original_price !== null && item.original_price !== undefined)
                        ? item.original_price
                        : item.price;
                    
                    // Log 4: Mostra o cálculo do desconto para cada item
                    console.log(`  - Calculando desconto para ${item.product_name}: (${priceForDiscount} * ${item.quantity}) * (${discountValue} / 100)`);
                    
                    discountedItemIds.add(item.id);

                    return sum + (priceForDiscount * item.quantity * (discountValue / 100));
                }, 0);

                totalDiscount += currentCouponDiscount;
                eligibleItemFound = true;
                
                // Log 5: Mostra o desconto acumulado para o cupão atual
                console.log(`Desconto total deste cupão: ${currentCouponDiscount.toFixed(2)}`);
            } else {
                console.log('Nenhum item elegível encontrado para este cupão.');
            }
        }

        if (!eligibleItemFound) {
            console.log('Erro: Nenhum cupão se aplica a um produto elegível.');
            return res.status(400).json({
                message: 'Nenhum cupão se aplica a um produto elegível no seu carrinho.'
            });
        }
        
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        let newTotal = subtotal - totalDiscount;

        if (newTotal < 0) {
            newTotal = 0;
        }

        // Log 6: Mostra os valores finais antes de enviar a resposta
        console.log('\n--- Resultado Final ---');
        console.log(`Subtotal (calculado com item.price): ${subtotal.toFixed(2)}`);
        console.log(`Desconto Total Acumulado: ${totalDiscount.toFixed(2)}`);
        console.log(`Novo Total da Encomenda: ${newTotal.toFixed(2)}`);
        console.log('--- Fim da execução ---');

        res.status(200).json({
            message: 'Cupões aplicados com sucesso!',
            discount: totalDiscount,
            newTotal: newTotal
        });

    } catch (err) {
        // Log 7: Captura e exibe o erro completo
        console.error('Erro geral ao aplicar o cupão:', err);
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