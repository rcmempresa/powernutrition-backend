const express = require('express');
const router = express.Router();
const FlavorController = require('../controllers/FlavorController'); // <--- Importa o novo controlador
const adminMiddleware = require('../middlewares/AdminMiddleware');
const userMiddleware = require('../middlewares/UserMiddleware');

// --- ROTAS DA API DE SABORES ---

// GET /api/flavors/listar
// Retorna todos os sabores
router.get('/listar', FlavorController.listAll);

// GET /api/flavors/listar/:id
// Retorna um sabor específico por ID
router.get('/listar/:id', FlavorController.getById);

// POST /api/flavors/criar
// Cria um novo sabor (protegido por autenticação)
router.post('/criar', userMiddleware,adminMiddleware, FlavorController.create);

// PUT /api/flavors/atualizar/:id
// Atualiza um sabor existente por ID (protegido por autenticação)
router.put('/atualizar/:id', userMiddleware,adminMiddleware, FlavorController.update);

// DELETE /api/flavors/remover/:id
// Remove um sabor por ID (protegido por autenticação)
router.delete('/remover/:id', userMiddleware,adminMiddleware, FlavorController.remove);

module.exports = router;
