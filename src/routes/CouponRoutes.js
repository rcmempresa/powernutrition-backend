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

// --- NOVA ROTA para aplicar um cupão e calcular o desconto ---
router.post('/apply', couponController.applyCoupon);

// Rota para atualizar um cupão existente
router.put('/atualizar/:id', couponController.updateCoupon);

// Rota para eliminar um cupão
router.delete('/remover/:id', couponController.deleteCoupon);


module.exports = router;
