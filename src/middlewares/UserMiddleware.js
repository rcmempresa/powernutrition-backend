// userMiddleware.js
const jwt = require('jsonwebtoken');

const userMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Tente com a chave hardcoded
    const decoded = jwt.verify(token, 'powernutrition'); 
    
    req.user = decoded;
    next();
  } catch (err) {
    console.error(err); // Para ver o erro
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

module.exports = userMiddleware;