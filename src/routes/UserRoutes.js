const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const userMiddleware = require('../middlewares/UserMiddleware');
const adminMiddleware = require('../middlewares/AdminMiddleware');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.patch('/promote/:userId', userMiddleware, adminMiddleware, userController.promoteToAdmin);
router.get('/listar', userMiddleware, adminMiddleware, userController.getAllUsers);
router.get('/listar/:id', userMiddleware, userController.getUserById);
router.put('/atualizar/:id', userMiddleware, userController.updateUser);
router.delete('/remover/:id', userMiddleware, adminMiddleware, userController.deleteUser);



module.exports = router;
