const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductController');
const userMiddleware = require('../middlewares/UserMiddleware');
const adminMiddleware = require('../middlewares/AdminMiddleware');

// Rotas públicas (listagem e detalhes)
router.get('/listar', productController.listProducts);
router.get('/listar/:id', productController.getProductById);

// Rotas de administração (só acessíveis com os middlewares de utilizador e admin)

// Rota para criar um novo produto e sua primeira variante
router.post('/criar', userMiddleware, adminMiddleware, productController.createProductAndVariant);

// Rota para atualizar o produto principal
// Esta rota lida com dados como nome, descrição e marca.
router.put('/atualizar/:id', userMiddleware, adminMiddleware, productController.updateProduct);

// ✨ NOVA Rota para atualizar uma variante específica
// O :variantId na URL permite que o backend saiba exatamente qual variante atualizar.
router.put('/atualizar/:productId/variantes/:variantId', userMiddleware, adminMiddleware, productController.updateVariant);

// Rota para adicionar uma nova variante a um produto existente
// Esta rota já estava no seu ficheiro e está correta para o novo formulário.
router.post('/adicionar-variante/:productId', userMiddleware, adminMiddleware, productController.addVariantToProduct);

router.delete('/eliminar/:id', userMiddleware, adminMiddleware, productController.deleteProduct);

module.exports = router;
