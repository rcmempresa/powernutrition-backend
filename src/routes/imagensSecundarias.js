const express = require('express');
const router = express.Router();
const productImageSecundariaController = require('../controllers/productImageSecundariaController');

// Rota para obter todas as imagens de um produto
router.get('/byProductId/:productId', productImageSecundariaController.getImagesByProductId);

// Rota para criar uma nova imagem
router.post('/create', productImageSecundariaController.createImage);

// Rota para atualizar uma imagem existente (PUT)
router.put('/update/:id', productImageSecundariaController.updateImage);

// Rota para deletar uma imagem
router.delete('/delete/:id', productImageSecundariaController.deleteImage);

// Rota para definir uma imagem como primária
router.put('/setPrimary/:id', productImageSecundariaController.setPrimaryImage);

module.exports = router;