const express = require('express');
const router = express.Router();
const orderController = require('../controllers/OrderController');
const userMiddleware = require('../middlewares/UserMiddleware');

router.post('/checkout', userMiddleware, orderController.checkout);
router.get('/listar', userMiddleware, orderController.listUserOrders);

module.exports = router;
