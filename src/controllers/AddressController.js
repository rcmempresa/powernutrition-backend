const addressModel = require('../models/AddressModel');

const createAddress = async (req, res) => {
  const { address_type } = req.body;

  if (!address_type) {
    return res.status(400).json({ message: 'O tipo de morada (address_type) é obrigatório.' });
  }

  try {
    const userId = req.user.id;
    const addressData = req.body;
    const newAddress = await addressModel.createAddress(userId, addressData);
    res.status(201).json(newAddress);
  } catch (err) {
    console.error('Erro ao criar endereço:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};


const listAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await addressModel.getAddressesByUserId(userId);
    res.json(addresses);
  } catch (err) {
    console.error('Erro ao listar endereços:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = parseInt(req.params.id, 10);
    const updateData = req.body;
    const updatedAddress = await addressModel.updateAddress(userId, addressId, updateData);
    if (!updatedAddress) {
      return res.status(404).json({ message: 'Endereço não encontrado' });
    }
    res.json(updatedAddress);
  } catch (err) {
    console.error('Erro ao atualizar endereço:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = parseInt(req.params.id, 10);
    await addressModel.deleteAddress(userId, addressId);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao apagar endereço:', err);
    if (err.message.includes('associado a encomendas')) {
      return res.status(400).json({ message: err.message });
    }
    if (err.message.includes('não encontrado')) {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};


module.exports = {
  createAddress,
  listAddresses,
  updateAddress,
  deleteAddress,
};
