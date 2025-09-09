const express = require('express');
const router = express.Router();
const brandController = require('../controllers/BrandController');
const userMiddleware = require('../middlewares/UserMiddleware');

router.use(userMiddleware);

router.get('/listar', brandController.getBrands);

module.exports = router;
