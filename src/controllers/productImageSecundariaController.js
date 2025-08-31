// src/controllers/productImageSecundariaController.js
const ProductImage = require('../models/productImageSecundariaModel');

const productImageSecundariaController = {
  // GET: Obter todas as imagens de um produto específico
  async getImagesByProductId(req, res) {
    try {
      const { productId } = req.params;
      const images = await ProductImage.getImagesByProductId(productId);

      if (images.length === 0) {
        return res.status(404).json({ message: 'Nenhuma imagem encontrada para este produto.' });
      }

      res.status(200).json(images);
    } catch (err) {
      console.error('Erro no controller ao buscar imagens:', err);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  // POST: Criar uma nova imagem para um produto
  async createImage(req, res) {
    try {
      const { product_id, image_url, is_primary } = req.body;
      if (!product_id || !image_url) {
        return res.status(400).json({ message: 'product_id e image_url são obrigatórios.' });
      }

      const newImage = await ProductImage.create(product_id, image_url, is_primary);
      res.status(201).json(newImage);
    } catch (err) {
      console.error('Erro no controller ao criar imagem:', err);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  // PUT: Atualizar uma imagem existente
  async updateImage(req, res) {
    try {
      const { id } = req.params;
      const { image_url, is_primary } = req.body;

      if (!image_url && is_primary === undefined) {
        return res.status(400).json({ message: 'Pelo menos image_url ou is_primary deve ser fornecido.' });
      }
      
      const updatedImage = await ProductImage.update(id, image_url, is_primary);
      
      if (!updatedImage) {
        return res.status(404).json({ message: 'Imagem não encontrada.' });
      }
      
      res.status(200).json(updatedImage);
    } catch (err) {
      console.error('Erro no controller ao atualizar imagem:', err);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  // DELETE: Deletar uma imagem
  async deleteImage(req, res) {
    try {
      const { id } = req.params;
      const deletedImage = await ProductImage.delete(id);

      if (!deletedImage) {
        return res.status(404).json({ message: 'Imagem não encontrada.' });
      }

      res.status(200).json({ message: 'Imagem deletada com sucesso.', deletedImage });
    } catch (err) {
      console.error('Erro no controller ao deletar imagem:', err);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },

  // PUT: Definir uma imagem como primária
  async setPrimaryImage(req, res) {
    try {
      const { id } = req.params;
      const { product_id } = req.body;

      if (!product_id) {
        return res.status(400).json({ message: 'product_id é obrigatório para definir a imagem primária.' });
      }

      const newPrimary = await ProductImage.setPrimary(id, product_id);

      if (!newPrimary) {
        return res.status(404).json({ message: 'Imagem ou produto não encontrado.' });
      }

      res.status(200).json(newPrimary);
    } catch (err) {
      console.error('Erro no controller ao definir imagem como primária:', err);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  },
};

module.exports = productImageSecundariaController;