const orderModel = require('../models/OrderModel');
const userModel = require('../models/UserModel');
const productModel = require('../models/ProductModel');
const addressModel = require('../models/AddressModel');
const { sendEmail } = require('../services/emailService');
const db = require('../config/db');
require('dotenv').config();

// --- Gera tabela de produtos em HTML ---
const gerarTabelaProdutos = (items) => {
  if (!items || items.length === 0) return '<p>Nenhum produto encontrado.</p>';

  const rows = items.map(item => {
    const price = parseFloat(item.price);
    const total = parseFloat(item.price) * item.quantity;

    return `
      <tr>
        <td style="text-align: left; padding: 10px 0; border-bottom: 1px solid #4b5563;">${item.name}</td>
        <td style="text-align: center; padding: 10px 0; border-bottom: 1px solid #4b5563;">${item.quantity}</td>
        <td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #4b5563;">€${price.toFixed(2)}</td>
        <td style="text-align: right; padding: 10px 0; border-bottom: 1px solid #4b5563;">€${total.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  return `
    <table cellpadding="6" cellspacing="0" style="width: 100%; margin-top: 20px; border-collapse: collapse; color: #ffffff;">
      <thead style="background-color: #f97316;">
        <tr>
          <th style="text-align: left; padding: 10px 0;">Produto</th>
          <th style="text-align: center; padding: 10px 0;">Quantidade</th>
          <th style="text-align: right; padding: 10px 0;">Preço Unitário</th>
          <th style="text-align: right; padding: 10px 0;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

// --- Gera HTML da morada de envio ---
const gerarMoradaHtml = (morada) => {
  if (!morada) return '<p><strong>Morada:</strong> Não disponível.</p>';

  return `
    <div style="margin-top: 20px; color: #e5e7eb;">
      <h3 style="color: #f97316;">📍 Morada de Envio</h3>
      <p style="margin: 5px 0;"><strong>Morada:</strong> ${morada.address_line1}, ${morada.address_line2}</p>
      <p style="margin: 5px 0;"><strong>Cidade:</strong> ${morada.city}</p>
      <p style="margin: 5px 0;"><strong>Código Postal:</strong> ${morada.postal_code}</p>
      <p style="margin: 5px 0;"><strong>País:</strong> ${morada.country}</p>
    </div>
  `;
};

const handleEasyPayCallback = async (req, res) => {
  // A variável `req.user` não deve ser usada aqui.
  // A requisição de callback é feita diretamente pela EasyPay,
  // não por um utilizador logado.
  // Você deve obter o ID do utilizador a partir da encomenda que encontrou.

  const notification = req.body;
  console.log('Payload de callback da EasyPay recebido:', notification);

  // **PASSO CRÍTICO**: Responder rapidamente à Easypay para evitar reenvios.
  res.status(200).send('OK');

  try {
    let easypayId = null;
    let isPaid = false;

    // Lógica para a API V3 (callback com 'status: paid')
    if (notification.status === 'paid' && notification.method?.reference) {
      isPaid = true;
      easypayId = notification.id;
    }
    // Lógica para a API V2 (callback sem 'status' no nível superior, mas com 'transaction.values.paid')
    else if (notification.transaction?.values?.paid && notification.method === 'MB') {
      isPaid = true;
      easypayId = notification.id;
    }

    // Se o callback não for de um pagamento concluído, a função termina aqui.
    if (!isPaid) {
      console.warn(`Callback da EasyPay recebido, mas não é uma notificação de pagamento concluído.`);
      return;
    }

    console.log(`Pagamento confirmado! A referência para a busca é: ${easypayId}`);

    // **PASSO CRÍTICO**: Procurar na base de dados pelo ID do pagamento da EasyPay.
    const existingOrder = await orderModel.getOrderByEasyPayId(easypayId);

    if (!existingOrder) {
      console.warn(`Encomenda com o EasyPay ID ${easypayId} não encontrada.`);
      return;
    }

    // Prevenção de processamento duplicado para evitar que emails sejam enviados várias vezes.
    if (existingOrder.status === 'pago') {
      console.log(`Pedido #${existingOrder.id} já foi processado. A ignorar callback.`);
      return;
    }
    
    // Atualiza o status da encomenda para "pago".
    const updatedOrder = await orderModel.updatePaymentStatus(existingOrder.id, 'pago');
    console.log(`Pedido #${updatedOrder.id} marcado como pago.`);

    // --- CORREÇÃO AQUI ---
    // Buscar os itens da encomenda ANTES de tentar atualizar o stock.
    const orderItems = await orderModel.getOrderItems(updatedOrder.id);
    const ID_UTILIZADOR_ESPECIFICO = '12345';
    const userId = updatedOrder.user_id; // Obter o ID do utilizador da própria encomenda

    // Iterar sobre cada item para decrementar o stock corretamente
    for (const item of orderItems) {
      if (userId === ID_UTILIZADOR_ESPECIFICO) {
        await productModel.decrementStockGinasio(item.product_id, item.quantity);
      } else {
        await productModel.decrementStock(item.product_id, item.quantity);
      }
    }

    // --- A sua lógica de envio de emails começa aqui ---
    const user = await userModel.getUserById(updatedOrder.user_id);
    const shippingAddress = await addressModel.getAddressById(updatedOrder.address_id);

    // Gerar HTML para os emails
    const tabelaHtml = gerarTabelaProdutos(orderItems);
    const moradaHtml = gerarMoradaHtml(shippingAddress);

    // Enviar e-mail de notificação para o dono da loja
    const shopOwnerEmail = process.env.SHOP_OWNER_EMAIL;
    if (shopOwnerEmail) {
        const ownerEmailSubject = `[PAGO] Nova Encomenda #${updatedOrder.id} Recebida!`;
        const ownerEmailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    <div style="background-color: #f97316; padding: 20px; text-align: center;">
                        <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Nova Encomenda Recebida!</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p>Olá,</p>
                        <p>A encomenda com ID <strong>#${updatedOrder.id}</strong> foi paga. Aqui estão os detalhes:</p>
                        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #e5e7eb;">
                            <h3 style="color: #f97316; margin-top: 0;">Detalhes da Encomenda</h3>
                            <p style="margin: 5px 0;"><strong>ID:</strong> #${updatedOrder.id}</p>
                            <p style="margin: 5px 0;"><strong>Cliente:</strong> ${user?.username || 'Não disponível'}</p>
                            <p style="margin: 5px 0;"><strong>E-mail do Cliente:</strong> ${user?.email || 'Não disponível'}</p>
                            <p style="margin: 5px 0;"><strong>Método de Pagamento:</strong> ${updatedOrder.payment_method}</p>
                            <h4 style="border-top: 1px solid #e5e7eb; padding-top: 10px; margin-top: 15px;">Valor Total: <span style="float: right; color: #f97316; font-size: 18px;">€${parseFloat(updatedOrder.total_price).toFixed(2)}</span></h4>
                        </div>
                        <h3 style="color: #f97316; margin-top: 20px;">Artigos da Encomenda</h3>
                        ${tabelaHtml}
                        ${moradaHtml}
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
            console.log('E-mail de notificação de pagamento para o dono da loja enviado.');
        } catch (emailError) {
            console.error('Erro ao enviar e-mail de notificação para o dono da loja:', emailError);
        }
    } else {
        console.warn('Variável de ambiente SHOP_OWNER_EMAIL não está definida.');
    }

    // Enviar e-mail de confirmação para o cliente
    if (user?.email) {
      const clientEmailSubject = `✅ Pagamento recebido para a Encomenda #${updatedOrder.id}!`;
      const clientEmailHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f8f8f8; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h2 style="color: #ffffff; font-size: 24px; margin: 0;">Pagamento Confirmado!</h2>
                </div>
                <div style="padding: 20px;">
                    <p>Olá, <strong>${user.username}</strong>!</p>
                    <p>Recebemos o pagamento da tua encomenda <strong>#${updatedOrder.id}</strong>. O teu pedido está agora a ser preparado para envio. Obrigado pela tua confiança!</p>
                    ${tabelaHtml}
                    ${moradaHtml}
                    <p style="margin-top: 30px;">Se tiveres alguma questão, contacta-nos.</p>
                </div>
                <div style="background-color: #f97316; padding: 15px; text-align: center; font-size: 12px; color: white; border-radius: 0 0 8px 8px;">
                    RD Power Nutrition &bull; <a href="http://localhost:5173" style="color: #ffffff; text-decoration: none;">www.rdpowernutrition.pt</a>
                </div>
            </div>
        </div>
      `;
      try {
          await sendEmail(user.email, clientEmailSubject, clientEmailHtml);
          console.log(`E-mail de confirmação de pagamento para o cliente ${user.email} enviado.`);
      } catch (emailError) {
          console.error('Erro ao enviar e-mail para o cliente:', emailError);
      }
    } else {
      console.warn(`Nenhum e-mail de cliente encontrado para o pedido #${updatedOrder.id}.`);
    }

  } catch (error) {
    console.error('Erro ao processar notificação de pagamento:', error);
  }
};


module.exports = { 
    handleEasyPayCallback 
};