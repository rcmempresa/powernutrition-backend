const addressModel = require('../models/AddressModel');

const createAddress = async (req, res) => {
  const { 
    address_type,
    address_line1,
    address_line2, // É opcional, mas deve ser incluído na verificação
    city,
    state_province,
    postal_code,
    country
  } = req.body;

  // Verificação básica dos campos obrigatórios
  if (!address_type || !address_line1 || !city || !postal_code || !country) {
    return res.status(400).json({ message: 'Campos obrigatórios da morada em falta.' });
  }

  try {
    const userId = req.user.id;
    const addressData = req.body;

    // Passo 1: Procurar por uma morada existente para ESTE utilizador
    const existingAddress = await addressModel.findExistingAddress(userId, {
      address_line1,
      address_line2,
      city,
      state_province,
      postal_code,
      country,
      address_type
    });

    if (existingAddress) {
      // Passo 2: Se a morada for encontrada, retorna a morada existente
      console.log('Morada existente encontrada, a reutilizar ID:', existingAddress.id);
      return res.status(200).json(existingAddress);
    }

    // Passo 3: Se não existir, cria uma nova morada
    const newAddress = await addressModel.createAddress(userId, addressData);
    console.log('Nova morada criada com ID:', newAddress.id);
    res.status(201).json(newAddress);
  } catch (err) {
    console.error('Erro ao processar morada:', err);
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
