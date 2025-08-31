// src/controllers/favoriteController.js
const favoriteModel = require('../models/favoriteModel');

// Função para adicionar um produto aos favoritos
const addFavorite = async (req, res) => {
  // Assume que o ID do utilizador é proveniente do middleware de autenticação (req.user.id)
  const userId = req.user.id; 
  // O ID do produto a ser adicionado virá no corpo da requisição
  const { productId } = req.body; 

  // Validação básica: verifica se o productId foi fornecido e é um número válido
  if (!productId || isNaN(Number(productId))) {
    return res.status(400).json({ message: 'O ID do produto é obrigatório e deve ser um número válido.' });
  }

  try {
    // Chama a função do modelo para adicionar o produto aos favoritos
    const favorite = await favoriteModel.addFavoriteProduct(userId, productId);
    
    // Se a função do modelo retornar um registo, significa que foi adicionado (não existia antes)
    if (favorite) {
      res.status(201).json({ message: 'Produto adicionado aos favoritos com sucesso.', favorite });
    } else {
      // Se não houver retorno (devido ao ON CONFLICT DO NOTHING no SQL),
      // significa que o produto já estava nos favoritos
      res.status(200).json({ message: 'Produto já se encontra nos favoritos.' });
    }
  } catch (error) {
    console.error('Erro ao adicionar favorito:', error);
    // Em caso de erro, retorna uma mensagem de erro 500
    res.status(500).json({ message: 'Erro interno do servidor ao adicionar favorito.' });
  }
};

// Função para remover um produto dos favoritos
const removeFavorite = async (req, res) => {
  // Assume que o ID do utilizador é proveniente do middleware de autenticação
  const userId = req.user.id; 
  // O ID do produto a ser removido virá na URL, e é convertido para número
  const productId = parseInt(req.params.productId); 

  // Validação básica: verifica se o productId é um número válido
  if (isNaN(productId)) {
    return res.status(400).json({ message: 'ID de produto inválido.' });
  }

  try {
    // Chama a função do modelo para remover o produto dos favoritos
    const deletedFavorite = await favoriteModel.removeFavoriteProduct(userId, productId);
    // Se a função do modelo retornar um registo, significa que foi eliminado
    if (deletedFavorite) {
      res.status(200).json({ message: 'Produto removido dos favoritos com sucesso.', deletedFavorite });
    } else {
      // Se não houver retorno, o produto não foi encontrado nos favoritos do utilizador
      res.status(404).json({ message: 'Produto não encontrado nos favoritos do utilizador.' });
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
