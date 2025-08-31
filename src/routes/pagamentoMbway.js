const express = require('express');
const router = express.Router();
const pagamentoMbwayController = require('../controllers/pagamentoMbwayController'); 

// Rota para adicionar checkout
router.post('/create',  pagamentoMbwayController.handleCheckout);

module.exports = router;
