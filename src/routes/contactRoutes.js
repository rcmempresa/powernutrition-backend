const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');
require('dotenv').config();

// Endpoint da API de Contacto
router.post('/', async (req, res) => {
    const { name, email, subject, message } = req.body;
    
    // Validação básica dos campos
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
    }

    try {
        // Enviar email para o dono da loja
        const shopOwnerEmail = process.env.SHOP_OWNER_EMAIL;
        if (shopOwnerEmail) {
            const ownerEmailSubject = `[NOVA MENSAGEM] Formulário de Contacto de ${name}`;
            const ownerEmailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <div style="background-color: #f97316; padding: 20px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 24px; margin: 0;">Nova Mensagem Recebida!</h1>
                        </div>
                        <div style="padding: 20px;">
                            <p>Olá,</p>
                            <p>Recebeste uma nova mensagem do teu formulário de contacto.</p>
                            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #e5e7eb;">
                                <h3 style="color: #f97316; margin-top: 0;">Detalhes da Mensagem</h3>
                                <p style="margin: 5px 0;"><strong>Nome:</strong> ${name}</p>
                                <p style="margin: 5px 0;"><strong>E-mail:</strong> ${email}</p>
                                <p style="margin: 5px 0;"><strong>Assunto:</strong> ${subject}</p>
                                <p style="margin: 5px 0;"><strong>Mensagem:</strong><br>${message}</p>
                            </div>
                        </div>
                        <div style="background-color: #f97316; padding: 15px; text-align: center; font-size: 14px;">
                            <p style="margin: 0; color: #ffffff;">&copy; ${new Date().getFullYear()} RD Power. Todos os direitos reservados.</p>
                        </div>
                    </div>
                </div>
            `;
            await sendEmail(shopOwnerEmail, ownerEmailSubject, ownerEmailHtml, 'proprietario');
            console.log('Email para o dono enviado com sucesso.');
        } else {
            console.warn('Variável de ambiente SHOP_OWNER_EMAIL não está definida. Email para o dono não será enviado.');
        }

        // Enviar email de confirmação para o cliente
        const clientEmailSubject = `✅ Confirmação: Mensagem Recebida - RD Power`;
        const clientEmailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f8f8f8; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);">
                    <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                        <h2 style="color: #ffffff; font-size: 24px; margin: 0;">Obrigado por nos contactar!</h2>
                    </div>
                    <div style="padding: 20px;">
                        <p>Olá, <strong>${name}</strong>!</p>
                        <p>Recebemos a sua mensagem com sucesso. A nossa equipa irá analisá-la e responder o mais brevemente possível.</p>
                        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px solid #e5e7eb;">
                            <h3 style="color: #f97316; margin-top: 0;">Detalhes da sua Mensagem</h3>
                            <p style="margin: 5px 0;"><strong>Assunto:</strong> ${subject}</p>
                            <p style="margin: 5px 0;"><strong>Mensagem:</strong><br>${message}</p>
                        </div>
                        <p style="margin-top: 30px;">Com os melhores cumprimentos,<br>A Equipa RD Power</p>
                    </div>
                    <div style="background-color: #f97316; padding: 15px; text-align: center; font-size: 12px; color: white; border-radius: 0 0 8px 8px;">
                        RD Power Nutrition &bull; <a href="http://localhost:5173" style="color: #ffffff; text-decoration: none;">www.rdpowernutrition.pt</a>
                    </div>
                </div>
            </div>
        `;
        await sendEmail(email, clientEmailSubject, clientEmailHtml); 
        console.log(`Email de confirmação para ${email} enviado com sucesso.`);

        // Resposta final de sucesso
        res.status(200).json({ success: 'Mensagem enviada com sucesso!' });
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        res.status(500).json({ error: 'Ocorreu um erro ao enviar a mensagem. Por favor, tente novamente.' });
    }
});

module.exports = router;