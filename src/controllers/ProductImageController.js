const ProductImageModel = require('../models/ProductImageModel');

const addImage = async (req, res) => {
  try {
    const { productId, imageUrl } = req.body;
    const image = await ProductImageModel.addImage(productId, imageUrl);
    res.status(201).json(image);
  } catch (err) {
    console.error('Erro ao adicionar imagem:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

const getImages = async (req, res) => {
  try {
    const productId = req.params.productId;
    const images = await ProductImageModel.getImagesByProduct(productId);
    res.json(images);
  } catch (err) {
    console.error('Erro ao buscar imagens:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

const deleteImage = async (req, res) => {
  try {
    const imageId = req.params.id;
    await ProductImageModel.deleteImage(imageId);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao apagar imagem:', err);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

module.exports = { addImage, getImages, deleteImage };
