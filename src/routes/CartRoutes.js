const express = require('express');
const router = express.Router();
const cartController = require('../controllers/CartController');
const userMiddleware = require('../middlewares/UserMiddleware');

router.use(userMiddleware);

router.get('/listar', cartController.getCart);
router.post('/adicionar', cartController.addToCart);
router.patch('/atualizar', cartController.updateQuantity);
router.delete('/remover/:variantId', cartController.removeFromCart);

module.exports = router;
