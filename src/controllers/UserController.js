const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/UserModel');
const db = require('../config/db');
const { isValidEmail } = require('../utils/validation');
const { sendEmail } = require('../services/emailService'); 

const register = async (req, res) => {
  let emailSentSuccessfully = true;

  try {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      phone_number,
      address_line1,
      address_line2,
      city,
      state_province,
      postal_code,
      country
    } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail) return res.status(400).json({ message: 'Este email já se encontra registado' });

    const existingUsername = await userModel.findByUsername(username);
    if (existingUsername) return res.status(400).json({ message: 'Este username já está em uso' });


    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userModel.createUser({
      username,
      email,
      password_hash: hashedPassword,
      first_name,
      last_name,
      phone_number,
      address_line1,
      address_line2,
      city,
      state_province,
      postal_code,
      country,
      is_admin: false
    });

    // 📩 Lógica para enviar o e-mail de boas-vindas com template completo
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #e5e7eb; background-color: #1f2937; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #374151; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <div style="background-color: #f97316; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 24px; margin-top: 15px; margin-bottom: 0;">Bem-vindo à RD PowerNutrition!</h1>
          </div>
    
          <div style="padding: 20px; text-align: center;">
            <p style="font-size: 16px;">Olá, <strong>${username}</strong>,</p>
            <p>Agradecemos por te juntares à nossa comunidade. Estamos entusiasmados por ter-te a bordo!</p>
            <p>Para começares a explorar os nossos suplementos e produtos de fitness, clica no botão abaixo para iniciar sessão.</p>
            
            <a href="https://www.rdpowernutrition.pt/login" 
               style="display: inline-block; background-color: #f97316; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">
               Iniciar Sessão Agora
            </a>
          </div>
    
          <div style="background-color: #2c3440; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">Se tiveres alguma questão, não hesites em contactar-nos.</p>
            <p style="margin: 5px 0;">Visita o nosso site: <a href="https://www.rdpowernutrition.pt" style="color: #f97316; text-decoration: none;">www.rdpowernutrition.pt</a></p>
            <p style="margin-top: 10px; color: #9ca3af;">&copy; ${new Date().getFullYear()} RD Power. Todos os direitos reservados.</p>
          </div>
    
        </div>
      </div>
    `;

    try {
      await sendEmail(email, `Bem-vindo à RD Power, ${username}!`, emailHtml);
    } catch (emailError) {
      console.error('Erro ao enviar e-mail de registo:', emailError);
      emailSentSuccessfully = false;
    }

    if (emailSentSuccessfully) {
        res.status(201).json({ message: 'Utilizador registado com sucesso. Verifique o seu e-mail para a mensagem de boas-vindas.' });
    } else {
        res.status(201).json({ message: 'Utilizador registado com sucesso. Não foi possível enviar a mensagem de boas-vindas neste momento.' });
    }
  } catch (err) {
    console.error('Erro no registo:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};



const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Email não encontrado' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Palavra-passe incorreta' });
    }

    const token = jwt.sign(
      { id: user.id, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};


const promoteToAdmin = async (req, res) => {
  const { userId } = req.params;

  try {
    // Atualiza is_admin para true no user com id = userId
    const result = await db.query(
      'UPDATE users SET is_admin = true WHERE id = $1 RETURNING id, username, email, is_admin',
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    res.json({ message: 'Utilizador promovido a admin', user: result.rows[0] });
  } catch (err) {
    console.error('Erro ao promover utilizador a admin:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error('Erro ao listar utilizadores:', err);
    res.status(500).json({ message: 'Erro interno ao procurar utilizadores' });
  }
};

const getUserById = async (req, res) => {
  const userId = parseInt(req.params.id);
  const requester = req.user;

  if (requester.id !== userId && !requester.is_admin) {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  try {
    const user = await userModel.getUserById(userId);
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado' });

    res.json(user);
  } catch (err) {
    console.error('Erro ao buscar utilizador:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

const updateUser = async (req, res) => {
  const userId = parseInt(req.params.id);
  const requester = req.user;

  if (requester.id !== userId && !requester.is_admin) {
    return res.status(403).json({ message: 'Acesso negado.' });
  }

  const allowedFields = [
    'username', 'email', 'first_name', 'last_name',
    'phone_number', 'address_line1', 'address_line2',
    'city', 'state_province', 'postal_code', 'country'
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field]) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'Nenhum campo válido fornecido para atualizar.' });
  }

  try {
    const updatedUser = await userModel.updateUserById(userId, updates);
    res.json(updatedUser);
  } catch (err) {
    console.error('Erro ao atualizar utilizador:', err);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

const deleteUser = async (req, res) => {
  const userId = req.params.id; // Assume que o ID é uma string (UUID, por exemplo)
  const requester = req.user; // Obtido do middleware de autenticação

  if (!requester || !requester.is_admin) {
    return res.status(403).json({ message: 'Apenas administradores podem eliminar utilizadores.' });
  }

  try {
    // ✨ PASSO 1: Eliminar os ENDEREÇOS associados ao utilizador ✨
    // Isto deve vir antes de eliminar os carrinhos, se os endereços não tiverem dependências de carrinhos,
    // ou a ordem exata pode depender de outras relações de chave estrangeira que tenha.
    await userModel.deleteAddressesByUserId(userId); 
    console.log(`Todos os endereços para o utilizador ${userId} foram eliminados.`);

    // ✨ PASSO 2: Eliminar os CARRINHOS associados ao utilizador ✨
    await userModel.deleteCartsByUserId(userId); 
    console.log(`Todos os carrinhos para o utilizador ${userId} foram eliminados.`);

    // ✨ PASSO 3: Eliminar o UTILIZADOR ✨
    const deletedUser = await userModel.deleteUserById(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    res.json({ message: 'Utilizador eliminado com sucesso.', user: deletedUser });
  } catch (err) {
    console.error('Erro ao eliminar utilizador (controller):', err);
    res.status(500).json({ message: err.message || 'Erro interno no servidor ao eliminar utilizador.' });
  }
};


// Exemplo de como a função getUserOrders pode ser
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query(
      `SELECT id, total_price, status, created_at 
       FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Nenhuma encomenda encontrada para este utilizador.' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar encomendas do utilizador:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

module.exports = { register, login ,promoteToAdmin, getAllUsers, getUserById, updateUser,deleteUser, getUserOrders};