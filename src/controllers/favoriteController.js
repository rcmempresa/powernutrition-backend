// src/controllers/favoriteController.js
const favoriteModel = require('../models/favoriteModel');

// Função para adicionar um produto aos favoritos
const addFavorite = async (req, res) => {
  const userId = req.user.id; 
  // Agora recebemos o ID da variante
  const { variantId } = req.body; 

  if (!variantId || isNaN(Number(variantId))) {
    return res.status(400).json({ message: 'O ID da variante é obrigatório e deve ser um número válido.' });
  }

  try {
    const favorite = await favoriteModel.addFavoriteVariant(userId, variantId);
    
    if (favorite) {
      res.status(201).json({ message: 'Produto adicionado aos favoritos com sucesso.', favorite });
    } else {
      res.status(200).json({ message: 'Produto já se encontra nos favoritos.' });
    }
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao adicionar favorito.' });
  }
};

// Função para remover um produto dos favoritos
const removeFavorite = async (req, res) => {
  const userId = req.user.id; 
  // O ID da VARIANTE a ser removida virá na URL, e é convertido para número
  const variantId = parseInt(req.params.variantId); 

  // --- Adicione estas linhas para ver o valor ---
  console.log('Valor recebido do URL para variantId:', req.params.variantId);
  console.log('Valor de variantId depois do parseInt:', variantId);
  // ----------------------------------------------

  // Validação básica: verifica se o variantId é um número válido
  if (isNaN(variantId)) {
    return res.status(400).json({ message: 'ID de variante inválido.' });
  }

  try {
    // Chama a função do modelo para remover a variante dos favoritos
    const deletedFavorite = await favoriteModel.removeFavoriteProduct(userId, variantId);
    // Se a função do modelo retornar um registo, significa que foi eliminado
    if (deletedFavorite) {
      res.status(200).json({ message: 'Variante removida dos favoritos com sucesso.', deletedFavorite });
    } else {
      // Se não houver retorno, a variante não foi encontrada nos favoritos do utilizador
      res.status(404).json({ message: 'Variante não encontrada nos favoritos do utilizador.' });
    }
  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    // Em caso de erro, retorna uma mensagem de erro 500
    res.status(500).json({ message: 'Erro interno do servidor ao remover favorito.' });
  }
};

// Função para listar os produtos favoritos de um utilizador
const listFavorites = async (req, res) => {
  // Assume que o ID do utilizador é proveniente do middleware de autenticação
  const userId = req.user.id; 

  try {
    // Chama a função do modelo para obter todos os produtos favoritos do utilizador
    const favorites = await favoriteModel.getFavoriteProductsByUserId(userId);
    // Retorna a lista de favoritos com status 200
    res.status(200).json(favorites);
  } catch (error) {
    console.error('Erro ao listar favoritos:', error);
    // Em caso de erro, retorna uma mensagem de erro 500
    res.status(500).json({ message: 'Erro interno do servidor ao listar favoritos.' });
  }
};

// Função para verificar se um produto específico é favorito de um utilizador
const checkFavorite = async (req, res) => {
  // Assume que o ID do utilizador é proveniente do middleware de autenticação
  const userId = req.user.id;
  // O ID do produto a ser verificado virá na URL, e é convertido para número
  const productId = parseInt(req.params.productId);

  // Validação básica: verifica se o productId é um número válido
  if (isNaN(productId)) {
    return res.status(400).json({ message: 'ID de produto inválido.' });
  }

  try {
    // Chama a função do modelo para verificar se o produto é favorito
    const isFavorite = await favoriteModel.isProductFavorite(userId, productId);
    // Retorna um objeto JSON com o resultado (true/false)
    res.status(200).json({ isFavorite });
  } catch (error) {
    console.error('Erro ao verificar favorito:', error);
    // Em caso de erro, retorna uma mensagem de erro 500
    res.status(500).json({ message: 'Erro interno do servidor ao verificar favorito.' });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  listFavorites,
  checkFavorite,
};
