// src/routes/FavoriteRoutes.js
const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const userMiddleware = require('../middlewares/UserMiddleware');


// Rota para adicionar um produto aos favoritos de um utilizador
// POST /api/favorites/add
// Espera no corpo da requisição: { productId: <id_do_produto> }
router.post('/add', userMiddleware, favoriteController.addFavorite);

// Rota para remover um produto dos favoritos de um utilizador
// DELETE /api/favorites/remove/:productId
// Espera o ID do produto na URL
router.delete('/remove/:variantId', userMiddleware, favoriteController.removeFavorite);

// Rota para listar todos os produtos favoritos de um utilizador
// GET /api/favorites/listar
router.get('/listar', userMiddleware, favoriteController.listFavorites);

// Rota para verificar se um produto específico é favorito de um utilizador
// GET /api/favorites/check/:productId
// Espera o ID do produto na URL
router.get('/check/:variantId', userMiddleware, favoriteController.checkFavorite);

module.exports = router;
