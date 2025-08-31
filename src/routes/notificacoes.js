const express = require('express');
const router = express.Router();
const notificacoesController = require('../controllers/notificacoesController'); 

// Rota para adicionar checkou
router.post('/callback', notificacoesController.handleEasyPayCallback);
module.exports = router;
