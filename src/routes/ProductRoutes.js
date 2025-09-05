const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductController');
const userMiddleware = require('../middlewares/UserMiddleware');
const adminMiddleware = require('../middlewares/AdminMiddleware');

// Rotas públicas (listagem e detalhes)
router.get('/listar', productController.listProducts);
router.get('/listar/:id', productController.getProductById);

// Rotas de administração (só acessíveis com os middlewares de utilizador e admin)
router.post('/criar', userMiddleware, adminMiddleware, productController.createProductAndVariant);

// ✨ Nova rota para adicionar uma variante a um produto existente
router.post('/adicionar-variante/:productId', userMiddleware, adminMiddleware, productController.addVariantToProduct);

router.put('/atualizar/:id', userMiddleware, adminMiddleware, productController.updateProduct);
router.delete('/eliminar/:id', userMiddleware, adminMiddleware, productController.deleteProduct);

module.exports = router;