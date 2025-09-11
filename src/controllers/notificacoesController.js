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

// Esta função processa as notificações de pagamento recebidas da EasyPay.
// É crucial que a resposta 'OK' seja enviada o mais rápido possível para evitar novas tentativas da EasyPay.
const handleEasyPayCallback = async (req, res) => {
  const notification = req.body;
  console.log('Payload de callback da EasyPay recebido:', notification);

  // Envia a resposta imediatamente para confirmar o recebimento do callback.
  res.status(200).send('OK');

  try {
    let easypayId = null;
    let isPaid = false;

    // --- Etapa 1: Verificar se o pagamento foi concluído e extrair o ID da EasyPay ---
    // A validação do estado do pagamento deve ser robusta, verificando diferentes estruturas de notificação.
    const isPaidWithReference = notification.status === 'paid' && notification.method?.reference;
    const isPaidWithMb = notification.transaction?.values?.paid && notification.method === 'MB';

    if (isPaidWithReference || isPaidWithMb) {
      isPaid = true;
      easypayId = notification.id;
    }

    if (!isPaid) {
      console.warn(`Callback da EasyPay recebido, mas não é uma notificação de pagamento concluído. Status: ${notification.status}`);
      return;
    }

    console.log(`Pagamento confirmado! O ID da EasyPay para a busca é: ${easypayId}`);

    // --- Etapa 2: Validar e processar a encomenda na base de dados ---
    const existingOrder = await orderModel.getOrderByEasyPayId(easypayId);

    if (!existingOrder) {
      console.warn(`Encomenda com o EasyPay ID ${easypayId} não encontrada. A ignorar o callback.`);
      return;
    }

    if (existingOrder.status === 'pago') {
      console.log(`Pedido #${existingOrder.id} já foi processado. A ignorar este callback para evitar duplicidade.`);
      return;
    }
    
    // Atualizar o status do pagamento para 'pago'
    const updatedOrder = await orderModel.updatePaymentStatus(existingOrder.id, 'pago');
    console.log(`Pedido #${updatedOrder.id} marcado como pago com sucesso.`);

    // --- Etapa 3: Decrementar o stock com base no tipo de utilizador ---
    const orderItems = await orderModel.getOrderItems(updatedOrder.id);
    const userId = updatedOrder.user_id;

    console.log(`Conteúdo de orderItems para o pedido #${updatedOrder.id}:`, orderItems);
    
    if (orderItems.length === 0) {
      console.warn(`O array orderItems está vazio para o pedido #${updatedOrder.id}. Não há stock para decrementar.`);
      // A função continua para o envio de e-mails, mas o loop é ignorado.
    } else {
      // IMPORTANTE: Este ID deve ser armazenado numa variável de ambiente (e.g., .env) por questões de segurança.
      const ID_UTILIZADOR_ESPECIFICO = process.env.GYM_USER_ID; 

      console.log(`A processar a diminuição do stock para a encomenda #${updatedOrder.id}.`);
      
      for (const item of orderItems) {
        if (userId === ID_UTILIZADOR_ESPECIFICO) {
          console.log(`Stock do ginásio a ser diminuído para o item ${item.name} (${item.variant_id}) em ${item.quantity} unidades.`);
          await productModel.decrementStockGinasio(item.variant_id, item.quantity);
        } else {
          console.log(`Stock regular a ser diminuído para o item ${item.name} (${item.variant_id}) em ${item.quantity} unidades.`);
          await productModel.decrementStock(item.variant_id, item.quantity);
        }
      }
    }

    // --- Etapa 4: Enviar e-mails de confirmação ---
    const user = await userModel.getUserById(updatedOrder.user_id);
    const shippingAddress = await addressModel.getAddressById(updatedOrder.address_id);

    const tabelaHtml = gerarTabelaProdutos(orderItems);
    const moradaHtml = gerarMoradaHtml(shippingAddress);

    // E-mail para o dono da loja
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

    // E-mail para o cliente
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
                    RD Power Nutrition &bull; <a href="https://www.rdpowernutrition.pt" style="color: #ffffff; text-decoration: none;">www.rdpowernutrition.pt</a>
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

    console.log(`Processo de notificação concluído com sucesso para a encomenda #${updatedOrder.id}.`);

  } catch (error) {
    console.error('Erro ao processar a notificação de pagamento:', error);
  }
};



module.exports = { 
    handleEasyPayCallback 
};
