const db = require('../config/db');

const createAddress = async (userId, addressData) => {
  const {
    address_line1,
    address_line2,
    city,
    state_province,
    postal_code,
    country,
    address_type // <-- adicionar isto
  } = addressData;

  const result = await db.query(
    `INSERT INTO addresses (
        user_id, address_line1, address_line2, city,
        state_province, postal_code, country, address_type
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      userId,
      address_line1,
      address_line2,
      city,
      state_province,
      postal_code,
      country,
      address_type // <-- e aqui
    ]
  );

  return result.rows[0];
};


const getAddressesByUserId = async (userId) => {
  const result = await db.query(
    'SELECT * FROM addresses WHERE user_id = $1',
    [userId]
  );
  return result.rows;
};

const updateAddress = async (userId, addressId, updateData) => {
  const { address_line1, address_line2, city, state_province, postal_code, country } = updateData;
  const result = await db.query(
    `UPDATE addresses SET
      address_line1 = COALESCE($1, address_line1),
      address_line2 = COALESCE($2, address_line2),
      city = COALESCE($3, city),
      state_province = COALESCE($4, state_province),
      postal_code = COALESCE($5, postal_code),
      country = COALESCE($6, country),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $7 AND user_id = $8
    RETURNING *`,
    [address_line1, address_line2, city, state_province, postal_code, country, addressId, userId]
  );
  return result.rows[0];
};

const deleteAddress = async (userId, addressId) => {
  const checkOrders = await db.query(
    'SELECT COUNT(*) FROM orders WHERE address_id = $1',
    [addressId]
  );

  if (parseInt(checkOrders.rows[0].count) > 0) {
    throw new Error('Endereço está associado a encomendas e não pode ser apagado.');
  }

  const deleteResult = await db.query(
    'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING *',
    [addressId, userId]
  );

  if (deleteResult.rowCount === 0) {
    throw new Error('Endereço não encontrado ou não pertence ao utilizador.');
  }

  return deleteResult.rows[0];
};


module.exports = {
  createAddress,
  getAddressesByUserId,
  updateAddress,
  deleteAddress,
};
