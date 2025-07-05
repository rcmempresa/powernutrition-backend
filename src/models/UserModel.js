const db = require('../config/db');

const createUser = async (userData) => {
  const {
    username, email, password_hash,
    first_name, last_name,
    phone_number, address_line1, address_line2,
    city, state_province, postal_code, country
  } = userData;

  const result = await db.query(
    `INSERT INTO users (
      username, email, password_hash,
      first_name, last_name,
      phone_number, address_line1, address_line2,
      city, state_province, postal_code, country
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING id, username, email, is_admin, created_at`,
    [username, email, password_hash, first_name, last_name,
     phone_number, address_line1, address_line2, city,
     state_province, postal_code, country]
  );

  return result.rows[0];
};

const getAllUsers = async () => {
  const result = await db.query(
    `SELECT id, username, email, first_name, last_name, is_admin, created_at, updated_at FROM users ORDER BY created_at DESC`
  );
  return result.rows;
};

// Procurar utilizador por email (para login)
const findByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const findByUsername = async (username) => {
  const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
};

const getUserById = async (id) => {
  const result = await db.query(
    `SELECT id, username, email, first_name, last_name, phone_number,
            address_line1, address_line2, city, state_province, postal_code,
            country, is_admin, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

const updateUserById = async (id, updateData) => {
  const fields = [];
  const values = [];

  Object.entries(updateData).forEach(([key, value], index) => {
    fields.push(`${key} = $${index + 1}`);
    values.push(value);
  });

  values.push(id); // Para o WHERE

  const query = `
    UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${values.length}
    RETURNING id, username, email, first_name, last_name, phone_number,
              address_line1, address_line2, city, state_province,
              postal_code, country, is_admin, created_at, updated_at;
  `;

  const result = await db.query(query, values);
  return result.rows[0];
};

const deleteUserById = async (id) => {
  const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id, username, email', [id]);
  return result.rows[0];
};




module.exports = {
  createUser,
  findByEmail,
  findByUsername,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById
};
