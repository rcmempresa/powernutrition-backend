const express = require('express');
const router = express.Router();
const addressController = require('../controllers/AddressController');
const userMiddleware = require('../middlewares/UserMiddleware');

router.post('/morada', userMiddleware, addressController.createAddress);
router.get('/morada', userMiddleware, addressController.listAddresses);
router.put('/morada/:id', userMiddleware, addressController.updateAddress);
router.delete('/morada/:id', userMiddleware, addressController.deleteAddress);

module.exports = router;