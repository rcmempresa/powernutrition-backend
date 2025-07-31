const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/CategoryController');
const userMiddleware = require('../middlewares/UserMiddleware');
const adminMiddleware = require('../middlewares/AdminMiddleware');

// Rotas públicas (geralmente)
router.get('/listar', categoryController.listCategories); // Para listar todas as categorias
router.get('/listar/:id', categoryController.getCategoryById); // Para obter uma categoria específica

// Rotas protegidas (exigem autenticação e/ou permissão de admin)
// Aplique o userMiddleware para autenticação básica se quiser garantir que só usuários logados vejam
// Aplique o adminMiddleware para restringir a admins
router.post('/criar', userMiddleware, adminMiddleware, categoryController.createCategory);
router.put('/atualizar/:id', userMiddleware, adminMiddleware, categoryController.updateCategory);
router.delete('/eliminar/:id', userMiddleware, adminMiddleware, categoryController.deleteCategory);

module.exports = router;