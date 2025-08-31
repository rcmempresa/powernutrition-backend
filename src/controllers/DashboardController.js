const dashboardModel = require('../models/DashboardModel');

const getDashboardData = async (req, res) => {
  try {
    const data = await dashboardModel.getDashboardData();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno do servidor ao buscar dados do dashboard.' });
  }
};

module.exports = { getDashboardData };