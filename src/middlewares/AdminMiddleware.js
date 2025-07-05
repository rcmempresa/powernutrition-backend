const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ message: 'Acesso negado. Apenas admins.' });
  }
  next();
};

module.exports = adminMiddleware;