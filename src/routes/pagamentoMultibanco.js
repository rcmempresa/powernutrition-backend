const express = require('express');
const router = express.Router();
const pagamentoMultibancoController = require('../controllers/pagamentoMultibancoController'); 

// Rota para adicionar checkout
router.post('/create',  pagamentoMultibancoController.handleCheckout);

module.exports = router;
