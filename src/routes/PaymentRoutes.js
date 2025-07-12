const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');
const adminMiddleware = require('../middlewares/AdminMiddleware');
const userMiddleware = require('../middlewares/UserMiddleware');

router.post('/pagamentos/:orderId', userMiddleware,adminMiddleware, PaymentController.createPayment);
router.get('/pagamentos/:orderId', userMiddleware, adminMiddleware, PaymentController.getPaymentByOrderId);

module.exports = router;
