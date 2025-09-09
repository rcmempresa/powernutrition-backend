const express = require('express');
const router = express.Router();
const brandController = require('../controllers/BrandController');

router.get('/listar', brandController.getBrands);

module.exports = router;
