const db = require('../config/db');

const CouponModel = {
  createCoupon: async (couponData) => {
    const { code, discount_percentage, athlete_name } = couponData;
    const result = await db.query(
      `INSERT INTO coupons (code, discount_percentage, athlete_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [code, discount_percentage, athlete_name]
    );
    return result.rows[0];
  },

  getCouponByCode: async (code) => {
    const result = await db.query(
      'SELECT * FROM coupons WHERE code = $1 AND is_active = true',
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
  }
};

module.exports = CouponModel;
