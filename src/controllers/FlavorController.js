const db = require('../config/db'); // <--- Importa a conexão com a base de dados

const FlavorController = {
  // Retorna todos os sabores
  listAll: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM flavors');
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Erro ao listar sabores:', error);
      res.status(500).json({ message: 'Erro ao listar sabores.' });
    }
  },

  // Retorna um sabor específico por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query('SELECT * FROM flavors WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Sabor não encontrado.' });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao obter sabor por ID:', error);
      res.status(500).json({ message: 'Erro ao obter sabor por ID.' });
    }
  },

  // Cria um novo sabor
 create: async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'O nome do sabor é obrigatório.' });
      }

      // A consulta de INSERT deve ser feita apenas com o campo 'name',
      // pois o 'id' é gerado automaticamente pela base de dados.
      const result = await db.query(
        'INSERT INTO flavors (name) VALUES ($1) RETURNING *',
        [name]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar sabor:', error);
      res.status(500).json({ message: 'Erro ao criar sabor.' });
    }
  },

  // Atualiza um sabor existente por ID
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      const result = await db.query(
        'UPDATE flavors SET name = $1 WHERE id = $2 RETURNING *',
        [name, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Sabor não encontrado para atualização.' });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar sabor:', error);
      res.status(500).json({ message: 'Erro ao atualizar sabor.' });
    }
  },

  // Remove um sabor por ID
  remove: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query('DELETE FROM flavors WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Sabor não encontrado para remoção.' });
      }

      // Retorna 204 No Content para indicar sucesso na remoção
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao remover sabor:', error);
      res.status(500).json({ message: 'Erro ao remover sabor.' });
    }
  }
};

module.exports = FlavorController;
