const express = require('express');
const router = express.Router();
const pagamentoCCController = require('../controllers/pagamentoCCController'); 

// Rota para adicionar checkout
router.post('/create',  pagamentoCCController.handleCheckout);

module.exports = router;
