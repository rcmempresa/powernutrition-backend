const db = require('../config/db');
const express = require('express');
const router = express.Router();

// 👈 Rota para obter todas as avaliações de um produto
router.get('/byProductId/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        r.*, 
        u.username 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1 
      ORDER BY r.created_at DESC
    `, [productId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar avaliações:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// 👈 Rota para adicionar uma nova avaliação
router.post('/add', async (req, res) => {
  const { product_id, user_id, rating, comment } = req.body;

  // Verificação de dados obrigatórios
  if (!product_id || !user_id || !rating || !comment) {
    return res.status(400).json({ error: 'Dados da avaliação incompletos.' });
  }

  try {
  const result = await db.query(
    `INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *`,
    [product_id, user_id, rating, comment]
  );

  await db.query(
    `
    UPDATE products 
    SET 
      rating = (SELECT AVG(rating) FROM reviews WHERE product_id = $1),
      reviewCount = (SELECT COUNT(*) FROM reviews WHERE product_id = $1)
    WHERE id = $1
    `,
    [product_id]
  );

  res.status(201).json(result.rows[0]);
} catch (err) {
    console.error("Erro ao adicionar avaliação:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;