const db = require('../config/db');

const getDashboardData = async () => {
  try {
    // 1. Receita total de encomendas pagas
    const totalRevenueResult = await db.query(
      `SELECT SUM(total_price) FROM orders WHERE status = 'pago'`
    );
    const totalRevenue = parseFloat(totalRevenueResult.rows[0].sum) || 0;

    // 2. Total de encomendas
    const totalOrdersResult = await db.query(
      `SELECT COUNT(*) FROM orders WHERE status= 'pago'`
    );
    const totalOrders = parseInt(totalOrdersResult.rows[0].count, 10) || 0;

    // 3. Novos utilizadores (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersResult = await db.query(
      `SELECT COUNT(*) FROM users WHERE created_at >= $1`,
      [thirtyDaysAgo]
    );
    const newUsers = parseInt(newUsersResult.rows[0].count, 10) || 0;

     // 4. Produtos com stock baixo (agora junta as tabelas)
    const lowStockProductsCountResult = await db.query(
      `SELECT COUNT(DISTINCT p.id) FROM products p
       JOIN variantes v ON p.id = v.product_id
       WHERE v.stock_ginasio < 10 OR v.quantidade_em_stock < 10`
    );
    const lowStockProductsCount = parseInt(lowStockProductsCountResult.rows[0].count, 10) || 0;

    // 5. Dados de vendas para o gráfico (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlySalesResult = await db.query(
      `SELECT 
         DATE_TRUNC('month', created_at) AS month, 
         SUM(total_price) AS sales 
       FROM orders 
       WHERE status = 'paid' AND created_at >= $1 
       GROUP BY month 
       ORDER BY month`,
      [sixMonthsAgo]
    );

    const salesData = monthlySalesResult.rows.map(row => ({
      name: new Date(row.month).toLocaleString('pt-PT', { month: 'short' }),
      sales: parseFloat(row.sales),
    }));
    
    // 6. Lista completa de produtos com stock baixo (para o modal)
    const lowStockProductsListResult = await db.query(
      `SELECT p.id, p.name, p.image_url, 
              SUM(v.stock_ginasio) AS total_stock_ginasio, 
              SUM(v.quantidade_em_stock) AS total_quantidade_em_stock
       FROM products p
       JOIN variantes v ON p.id = v.product_id
       WHERE v.stock_ginasio < 10 OR v.quantidade_em_stock < 10
       GROUP BY p.id, p.name, p.image_url`
    );
    const lowStockProducts = lowStockProductsListResult.rows;

    // 7. Utilizador com mais encomendas
    const topUserResult = await db.query(
      `SELECT user_id, COUNT(*) as order_count
       FROM orders WHERE status = 'pago'
       GROUP BY user_id
       ORDER BY order_count DESC
       LIMIT 1`
    );
    
    let topUser = null;
    if (topUserResult.rows.length > 0) {
      const topUserId = topUserResult.rows[0].user_id;
      const userResult = await db.query(
        `SELECT username FROM users WHERE id = $1`,
        [topUserId]
      );
      if (userResult.rows.length > 0) {
          topUser = {
              username: userResult.rows[0].username,
              orderCount: parseInt(topUserResult.rows[0].order_count, 10),
          };
      }
    }

    // NOVO: Valor Médio do Pedido (VMP)
    let averageOrderValue = 0;
    if (totalOrders > 0) {
      averageOrderValue = totalRevenue / totalOrders;
    }

    // NOVO: Produtos Mais Vendidos
    const topProductsResult = await db.query(
      `SELECT p.id, p.name, p.image_url, SUM(oi.quantity) as total_sold
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'pago' -- ou 'delivered'
      GROUP BY p.id, p.name, p.image_url
      ORDER BY total_sold DESC
      LIMIT 5`
    );
    const topSellingProducts = topProductsResult.rows.map(product => ({
      ...product,
      total_sold: parseInt(product.total_sold, 10)
    }));
    
    // 8. Distribuição de estados das encomendas
    const orderStatusResult = await db.query(
        `SELECT status, COUNT(*) as count
         FROM orders
         GROUP BY status`
    );
    const orderStatusData = orderStatusResult.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count, 10),
    }));


    return {
      totalRevenue,
      totalOrders,
      newUsers,
      lowStockProductsCount,
      salesData,
      lowStockProducts,
      topUser,
      averageOrderValue, // Adicione o VMP
      topSellingProducts, // Adicione os produtos mais vendidos
      orderStatusData, // Adicione a distribuição de estados
    };
  } catch (error) {
    console.error('Erro no modelo ao buscar dados do dashboard:', error);
    throw error;
  }
};

module.exports = { getDashboardData };