const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middlewares/AdminMiddleware');
const userMiddleware = require('../middlewares/UserMiddleware');
const adminOrderController = require('../controllers/AdminOrderController');


router.get('/encomendas', userMiddleware, adminMiddleware, adminOrderController.listAllOrders);
router.get('/encomendas/:id',userMiddleware, adminMiddleware, adminOrderController.getOrderById);
router.put('/encomendas/:id',  userMiddleware, adminMiddleware,adminOrderController.updateOrder);
router.delete('/encomendas/:id', userMiddleware, adminMiddleware, adminOrderController.deleteOrder);

module.exports = router;
