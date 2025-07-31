const express = require('express');
const router = express.Router();
const couponController = require('../controllers/CouponController');

// Criar cupão
router.post('/criar', couponController.createCoupon);

// Buscar cupão por código
router.get('/listar/:code', couponController.getCouponByCode);

// Ver quantas vezes o cupão foi usado
router.get('/usage/:code', couponController.countCouponUsage);

// Listar todos os cupões
router.get('/listar', couponController.listCoupons);

module.exports = router;
