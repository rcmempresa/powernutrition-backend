const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductController');
const userMiddleware = require('../middlewares/UserMiddleware');
const adminMiddleware = require('../middlewares/AdminMiddleware');

router.get('/listar', productController.listProducts);
router.get('/listar/:id', productController.getProductById);

// Só admins podem criar, atualizar e eliminar produtos
router.post('/criar', userMiddleware, adminMiddleware, productController.createProduct);
router.put('/atualizar/:id', userMiddleware, adminMiddleware, productController.updateProduct);
router.delete('/eliminar/:id', userMiddleware, adminMiddleware, productController.deleteProduct);

module.exports = router;
