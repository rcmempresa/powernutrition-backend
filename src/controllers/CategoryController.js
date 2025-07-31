// controllers/CategoryController.js
const db = require('../config/db'); // Supondo que 'db' seja seu pool do 'pg'

const CategoryController = {
  // 1. Listar todas as categorias com a contagem de produtos
  async listCategories(req, res) {
    try {
      // O pool.query do 'pg' retorna um objeto 'result', onde os dados estão em 'result.rows'
      const result = await db.query(`
        SELECT
          c.id,
          c.name,
          c.description,
          COUNT(p.id) AS items
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id, c.name, c.description
        ORDER BY c.name;
      `);

      const rows = result.rows; // Extraia as linhas do objeto de resultado
      res.status(200).json(rows);
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      res.status(500).json({ message: 'Erro interno do servidor ao buscar categorias.' });
    }
  },

  // 2. Obter uma categoria por ID
  async getCategoryById(req, res) {
    const { id } = req.params;
    try {
      const result = await db.query('SELECT id, name, description FROM categories WHERE id = $1', [id]); // Note: Use $1 for parameters in pg
      const rows = result.rows; // Extraia as linhas
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Categoria não encontrada.' });
      }
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error(`Erro ao buscar categoria com ID ${id}:`, error);
      res.status(500).json({ message: 'Erro interno do servidor ao buscar categoria.' });
    }
  },

  // 3. Criar uma nova categoria (geralmente para admins)
  async createCategory(req, res) {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Nome da categoria é obrigatório.' });
    }
    try {
      // PG INSERT com RETURNING id para obter o ID inserido
      const result = await db.query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id',
        [name, description]
      );
      const insertedId = result.rows[0].id;
      res.status(201).json({ id: insertedId, name, description, message: 'Categoria criada com sucesso!' });
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      res.status(500).json({ message: 'Erro interno do servidor ao criar categoria.' });
    }
  },

  // 4. Atualizar uma categoria existente (geralmente para admins)
  async updateCategory(req, res) {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name && !description) {
      return res.status(400).json({ message: 'Pelo menos um campo (nome ou descrição) é obrigatório para atualização.' });
    }
    try {
      const result = await db.query(
        'UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3',
        [name, description, id]
      );
      if (result.rowCount === 0) { // 'pg' usa rowCount para linhas afetadas
        return res.status(404).json({ message: 'Categoria não encontrada.' });
      }
      res.status(200).json({ message: 'Categoria atualizada com sucesso!' });
    } catch (error) {
      console.error(`Erro ao atualizar categoria com ID ${id}:`, error);
      res.status(500).json({ message: 'Erro interno do servidor ao atualizar categoria.' });
    }
  },

  // 5. Deletar uma categoria (geralmente para admins)
  async deleteCategory(req, res) {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM categories WHERE id = $1', [id]);
      if (result.rowCount === 0) { // 'pg' usa rowCount para linhas afetadas
        return res.status(404).json({ message: 'Categoria não encontrada.' });
      }
      res.status(200).json({ message: 'Categoria deletada com sucesso!' });
    } catch (error) {
      console.error(`Erro ao deletar categoria com ID ${id}:`, error);
      res.status(500).json({ message: 'Erro interno do servidor ao deletar categoria.' });
    }
  }
};

module.exports = CategoryController;