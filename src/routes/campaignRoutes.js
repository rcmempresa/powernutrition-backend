// routes/CampaignRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Rota para criar uma nova campanha (apenas para admin)
router.post('/criar', async (req, res) => {
  try {
    // 1. Desestrutura os dados enviados no corpo da requisição, incluindo a URL da imagem.
    const { name, is_active, image_url } = req.body;

    // 2. Cria a query SQL para inserir uma nova campanha.
    // Usamos $1, $2, $3 para prevenir SQL Injection.
    const query = `
      INSERT INTO campaigns (name, is_active, image_url)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    
    // 3. Executa a query com os valores recebidos.
    const result = await pool.query(query, [name, is_active, image_url]);

    // 4. Responde com a nova campanha criada.
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao criar campanha:', error);
    res.status(500).json({ message: 'Erro interno ao criar campanha.' });
  }
});

// Rota para obter todas as campanhas (para o admin)
// Inclui os produtos associados para facilitar a gestão no painel de admin
router.get('/listar', async (req, res) => {
  try {
    const campaignsQuery = `
      SELECT c.id, c.name, c.is_active, c.image_url, -- ✨ Adicione esta linha
             json_agg(jsonb_build_object(
                 'id', p.id,
                 'name', p.name,
                 'image_url', p.image_url
             )) as products
      FROM campaigns c
      LEFT JOIN product_campaign pc ON c.id = pc.campaign_id
      LEFT JOIN products p ON pc.product_id = p.id
      GROUP BY c.id
      ORDER BY c.id DESC;
    `;
    const result = await pool.query(campaignsQuery);

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar campanhas:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para adicionar um produto a uma campanha
router.post('/:campaignId/adicionar-produto', async (req, res) => {
  const { campaignId } = req.params;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: 'O ID do produto é obrigatório.' });
  }

  try {
    await pool.query(
      "INSERT INTO product_campaign (campaign_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [campaignId, productId]
    );
    res.status(200).json({ message: 'Produto adicionado à campanha com sucesso.' });
  } catch (err) {
    console.error('Erro ao adicionar produto à campanha:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para remover um produto de uma campanha
router.delete('/:campaignId/remover-produto/:productId', async (req, res) => {
  const { campaignId, productId } = req.params;

  try {
    await pool.query(
      "DELETE FROM product_campaign WHERE campaign_id = $1 AND product_id = $2",
      [campaignId, productId]
    );
    res.status(200).json({ message: 'Produto removido da campanha com sucesso.' });
  } catch (err) {
    console.error('Erro ao remover produto da campanha:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

router.delete('/:campaignId', async (req, res) => {
  const { campaignId } = req.params;

  try {
    // 1. Apagar todas as ligações de produtos na tabela product_campaign
    await pool.query(
      "DELETE FROM product_campaign WHERE campaign_id = $1",
      [campaignId]
    );

    // 2. Apagar a própria campanha
    await pool.query(
      "DELETE FROM campaigns WHERE id = $1",
      [campaignId]
    );

    res.status(200).json({ message: 'Campanha e todas as suas ligações de produtos foram eliminadas com sucesso.' });
  } catch (err) {
    console.error('Erro ao eliminar a campanha:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para obter campanhas ativas (para o frontend)
router.get('/active', async (req, res) => {
  try {
    const campaignsQuery = `
      SELECT id, name, image_url -- ✨ Adicione 'image_url' aqui
      FROM campaigns
      WHERE is_active = true
      ORDER BY id ASC
    `;
    const campaignsResult = await pool.query(campaignsQuery);

    const campaigns = [];
    for (const campaign of campaignsResult.rows) {
      const productsQuery = `
       SELECT
  p.id,
  p.name,
  p.description,
  p.image_url,
  p.category_id,
  p.is_active,
  p.original_price,
  p.rating,
  p.reviewcount,
  json_agg(jsonb_build_object(
    'id', v.id,
    'preco', v.preco,
    'quantidade_em_stock', v.quantidade_em_stock,
    'sku', v.sku,
    'weight_value', v.weight_value,
    'weight_unit', v.weight_unit,
    'flavor_id', v.sabor_id,
    'flavor_name', f.name,
    'image_url', p.image_url
  )) AS variants
FROM products p
INNER JOIN product_campaign pc ON p.id = pc.product_id
INNER JOIN variantes v ON p.id = v.produto_id
LEFT JOIN flavors f ON v.sabor_id = f.id
WHERE pc.campaign_id = $1
GROUP BY p.id
      `;
      const productsResult = await pool.query(productsQuery, [campaign.id]);

      campaigns.push({
        ...campaign,
        products: productsResult.rows
      });
    }

    res.json(campaigns);
  } catch (error) {
    console.error('Erro ao buscar campanhas ativas:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});


module.exports = router;