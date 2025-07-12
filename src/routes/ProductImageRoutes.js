const express = require('express');
const router = express.Router();
const controller = require('../controllers/ProductImageController');
const adminMiddleware = require('../middlewares/AdminMiddleware');


router.post('/produtos/imagem', adminMiddleware, controller.addImage);
router.get('/produtos/:productId/imagens', controller.getImages);
router.delete('/produtos/imagem/:id', adminMiddleware, controller.deleteImage);

module.exports = router;
