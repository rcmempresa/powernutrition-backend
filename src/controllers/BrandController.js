const Brand = require('../models/BrandModel'); // 👈 Verifique se o caminho do ficheiro está correto.

const getBrands = async (req, res) => {
  try {
    // 💡 NOVO: Substitua a chamada de mock pela chamada real ao seu modelo.
    // Esta linha irá selecionar todas as marcas da tabela.
    const brands = await Brand.findAll();

    // Retorna a lista de marcas com um código de status 200 (OK).
    return res.status(200).json(brands);
  } catch (error) {
    console.error('Erro ao listar marcas:', error);
    // Em caso de erro, retorna um código de status 500 (Erro Interno do Servidor).
    return res.status(500).json({ message: 'Erro interno do servidor ao listar marcas.' });
  }
};

module.exports = {
  getBrands
};
