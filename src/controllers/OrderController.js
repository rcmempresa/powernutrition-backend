const orderModel = require('../models/OrderModel');
const cartModel = require('../models/CartModel');
const couponModel = require('../models/CouponModel');
const productModel = require('../models/ProductModel');
const userModel = require('../models/UserModel'); 
const { sendEmail } = require('../services/emailService'); 
const db = require('../config/db');

const checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId, couponCode, email, paymentMethod, paymentDetails } = req.body;

    const user = await userModel.getUserById(userId);
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado.' });
    if (user.email !== email) {
      console.warn(`[AVISO DE SEGURANÇA] Utilizador autenticado (${user.email}) solicitou a confirmação de encomenda para um e-mail diferente: ${email}`);
    }

    const cart = await cartModel.getOrCreateCart(userId);
    const cartItems = await cartModel.getCartItems(cart.id);
    if (!cartItems.length) return res.status(400).json({ message: 'Carrinho está vazio' });

    // Verificar stock de cada produto
    for (const item of cartItems) {
      const product = await productModel.findProductById(item.product_id);
      if (!product) return res.status(404).json({ message: `Produto com ID ${item.product_id} não encontrado` });
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Stock insuficiente para o produto "${product.name}". Disponível: ${product.stock_quantity}` 
        });
      }
    }
    
    let totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    if (couponCode) {
      const coupon = await couponModel.getCouponByCode(couponCode);
      if (coupon && coupon.is_active) {
        discount = coupon.discount_percentage ? totalPrice * (coupon.discount_percentage / 100) : coupon.discount_amount;
        totalPrice -= discount;
        if (totalPrice < 0) totalPrice = 0;
      } else {
        return res.status(400).json({ message: 'Cupão inválido ou inativo' });
      }
    }


    const easypayId = paymentDetails.payment_id;

    // Criar encomenda com os dados de pagamento
    const order = await orderModel.createOrder(
      userId, 
      addressId, 
      totalPrice, 
      'pendente', 
      couponCode || null,
      paymentMethod,
      easypayId
    );

    const productsForEmail = []; 
    for (const item of cartItems) {
      await orderModel.addOrderItem(order.id, item.product_id, item.quantity, item.price);
      
      const productDetails = await productModel.findProductById(item.product_id);
      productsForEmail.push({
          name: productDetails.name,
          quantity: item.quantity,
          price: productDetails.price // Use o preço do produto para garantir que é um número
      });

    }

    await orderModel.clearCart(cart.id);

    // Preparar e enviar o e-mail de confirmação para o cliente
    const produtosHtml = productsForEmail.map(p => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #4b5563;">
          <strong style="color: #ffffff;">${p.name}</strong><br>
          <span style="color: #9ca3af;">Quantidade: ${p.quantity}</span>
        </td>
        <td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #4b5563; color: #ffffff;">
          €${(parseFloat(p.price) * p.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    let emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #e5e7eb; background-color: #1f2937; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #374151; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <div style="background-color: #f97316; padding: 20px; text-align: center;">
            <img src="http://localhost:5173/rd_power.png" alt="RD Power Logo" style="width: 150px; height: auto;">
            <h1 style="color: #ffffff; font-size: 24px; margin-top: 15px; margin-bottom: 0;">Encomenda Confirmada!</h1>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px;">Olá, <strong>${user.username}</strong>,</p>
            <p>A tua encomenda **#${order.id}** foi recebida com sucesso e está a ser processada. Obrigado pela tua compra!</p>
            <div style="background-color: #4b5563; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <h3 style="color: #f97316; margin-top: 0;">Detalhes da Encomenda</h3>
              <p><strong>Data da Encomenda:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Método de Pagamento:</strong> ${paymentMethod}</p>
            </div>
            <h3 style="color: #f97316; margin-top: 20px;">Artigos da Encomenda</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 10px 0; border-bottom: 1px solid #6b7280; color: #ffffff;">Produto</th>
                  <th style="text-align: right; padding: 10px 0; border-bottom: 1px solid #6b7280; color: #ffffff;">Preço</th>
                </tr>
              </thead>
              <tbody>${produtosHtml}</tbody>
            </table>
            <div style="background-color: #4b5563; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr><td style="text-align: left; padding: 5px 0;">Subtotal:</td><td style="text-align: right; padding: 5px 0;">€${(totalPrice + discount).toFixed(2)}</td></tr>
                <tr><td style="text-align: left; padding: 5px 0;">Portes de Envio:</td><td style="text-align: right; padding: 5px 0;">€0.00</td></tr>
                <tr style="border-top: 1px solid #6b7280;"><td style="text-align: left; padding: 10px 0; font-weight: bold; color: #f97316;">Total:</td><td style="text-align: right; padding: 10px 0; font-weight: bold; color: #f97316;">€${totalPrice.toFixed(2)}</td></tr>
              </table>
            </div>
          </div>
          <div style="background-color: #2c3440; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">Se tiveres alguma questão, contacta-nos em <a href="mailto:suporte@rdpower.com" style="color: #f97316; text-decoration: none;">suporte@rdpower.com</a>.</p>
            <p style="margin-top: 10px; color: #9ca3af;">&copy; ${new Date().getFullYear()} RD Power. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    `;
    
    try {
      await sendEmail(email, `Confirmação de Encomenda #${order.id}`, emailHtml);
      console.log('E-mail de confirmação de encomenda para o cliente enviado com sucesso.');
    } catch (emailError) {
      console.error('Erro ao enviar e-mail de confirmação de encomenda para o cliente:', emailError);
    }
    
    // Envio de e-mail de notificação para o dono da loja
    const shopOwnerEmail = process.env.SHOP_OWNER_EMAIL;
    if (shopOwnerEmail) {
        const ownerEmailSubject = `Nova Encomenda #${order.id} Recebida!`;
        const ownerEmailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    
                    <div style="background-color: #f97316; padding: 20px; text-align: center;">
                        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Nova Encomenda Recebida!</h1>
                    </div>

                    <div style="padding: 20px;">
                        <p>Olá,</p>
                        <p>Acabou de receber uma nova encomenda na sua loja. Aqui estão os detalhes:</p>
                        
                        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #e5e7eb;">
                            <h3 style="color: #f97316; margin-top: 0;">Detalhes da Encomenda</h3>
                            <p style="margin: 5px 0;"><strong>ID:</strong> #${order.id}</p>
                            <p style="margin: 5px 0;"><strong>Cliente:</strong> ${user.username}</p>
                            <p style="margin: 5px 0;"><strong>E-mail do Cliente:</strong> ${email}</p>
                            <p style="margin: 5px 0;"><strong>Método de Pagamento:</strong> ${paymentMethod}</p>
                            <h4 style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 15px;">Valor Total: <span style="float: right; color: #f97316; font-size: 18px;">€${totalPrice.toFixed(2)}</span></h4>
                        </div>
                        
                        <h3 style="color: #f97316; margin-top: 20px;">Artigos da Encomenda</h3>
                        <table width="100%" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="text-align: left; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">Produto</th>
                                    <th style="text-align: right; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">Preço</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productsForEmail.map(p => `
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                                        <strong>${p.name}</strong><br>
                                        <span style="color: #6b7280;">Quantidade: ${p.quantity}</span>
                                    </td>
                                    <td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                                        €${(parseFloat(p.price) * p.quantity).toFixed(2)}
                                    </td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div style="background-color: #f97316; padding: 20px; text-align: center; font-size: 14px;">
                        <p style="margin: 0; color: #ffffff;">Por favor, verifique o painel de administração para processar a encomenda.</p>
                        <p style="margin-top: 10px; color: #ffffff;">&copy; ${new Date().getFullYear()} RD Power. Todos os direitos reservados.</p>
                    </div>
                </div>
            </div>
        `;

        try {
            await sendEmail(shopOwnerEmail, ownerEmailSubject, ownerEmailHtml);
            console.log('E-mail de notificação para o dono da loja enviado com sucesso.');
        } catch (emailError) {
            console.error('Erro ao enviar e-mail de notificação para o dono da loja:', emailError);
        }
    } else {
        console.warn('Variável de ambiente SHOP_OWNER_EMAIL não está definida. E-mail de notificação para o dono da loja não enviado.');
    }

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
    return res.json(orders.rows);
  } catch (err) {
    console.error('Erro ao listar encomendas:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

module.exports = {
  checkout,
  listUserOrders
};