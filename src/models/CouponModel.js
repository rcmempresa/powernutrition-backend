const db = require('../config/db');

const CouponModel = {
 createCoupon: async (couponData) => {
    const { 
        code, 
        discount_percentage, 
        athlete_name, 
        is_specific = false, 
        product_id = null  
    } = couponData;

    const result = await db.query(
      `INSERT INTO coupons (code, discount_percentage, athlete_name, is_specific, product_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [code, discount_percentage, athlete_name, is_specific, product_id]
    );
    return result.rows[0];
  },

  getCouponByCode: async (code) => {
    const result = await db.query(
      `SELECT *, is_specific, product_id FROM coupons WHERE code = $1 AND is_active = true`,
      [code]
    );
    return result.rows[0];
  },

  countOrdersWithCoupon: async (code) => {
    const result = await db.query(
      'SELECT COUNT(*) FROM orders WHERE coupon_code = $1',
      [code]
    );
    return parseInt(result.rows[0].count, 10);
  },

  listCoupons: async () => {
    const result = await db.query('SELECT * FROM coupons');
    return result.rows;
  },

  // **NOVA FUNÇÃO: Atualizar Cupão**
  updateCoupon: async (id, couponData) => {
    const { 
        code, 
        discount_percentage, 
        athlete_name, 
        is_specific, 
        product_id 
    } = couponData;

    const result = await db.query(
      `UPDATE coupons
       SET 
         code = $1, 
         discount_percentage = $2, 
         athlete_name = $3, 
         is_specific = $4,
         product_id = $5
       WHERE id = $6
       RETURNING *`,
      [code, discount_percentage, athlete_name, is_specific, product_id, id]
    );
    return result.rows[0];
  },

  // **NOVA FUNÇÃO: Eliminar Cupão**
  deleteCoupon: async (id) => {
    const result = await db.query(
      'DELETE FROM coupons WHERE id = $1',
      [id]
    );
    return result.rowCount;
  },
};

module.exports = CouponModel;