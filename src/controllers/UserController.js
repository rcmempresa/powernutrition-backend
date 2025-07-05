const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/UserModel');
const db = require('../config/db');
const { isValidEmail } = require('../utils/validation');


const register = async (req, res) => {
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

    res.status(201).json(user);
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
  const userId = parseInt(req.params.id);
  const requester = req.user;

  if (!requester.is_admin) {
    return res.status(403).json({ message: 'Apenas administradores podem eliminar utilizadores.' });
  }

  try {
    const deletedUser = await userModel.deleteUserById(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    res.json({ message: 'Utilizador eliminado com sucesso.', user: deletedUser });
  } catch (err) {
    console.error('Erro ao eliminar utilizador:', err);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};


module.exports = { register, login ,promoteToAdmin, getAllUsers, getUserById, updateUser,deleteUser};
