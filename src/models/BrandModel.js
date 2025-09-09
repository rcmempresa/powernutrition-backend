const db = require('../config/db');

/**
 * Seleciona todas as marcas da tabela 'brands'.
 * @returns {Promise<Array<Object>>} Uma promessa que resolve para um array de objetos de marca.
 */
const findAll = async () => {
  const result = await db.query('SELECT * FROM brands ORDER BY name ASC');
  return result.rows;
};

module.exports = {
  findAll,
};
