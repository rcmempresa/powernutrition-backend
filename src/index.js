const express = require('express');
const app = express();
const cors = require('cors'); // <--- Importe o módulo 'cors' aqui

// Importações das suas rotas
const userRoutes = require('./routes/UserRoutes');
const productRoutes = require('./routes/ProductRoutes');
const cartRoutes = require('./routes/CartRoutes');
const orderRoutes = require('./routes/OrderRoutes');
const adminOrderRoutes = require('./routes/AdminOrderRoutes');
const addressRoutes = require('./routes/AddressRoutes');
const paymentRoutes = require('./routes/PaymentRoutes');
const productImageRoutes = require('./routes/ProductImageRoutes');
const couponRoutes = require('./routes/CouponRoutes');
const categoryRoutes = require('./routes/CategoryRoutes'); // Sua rota de categorias

require('dotenv').config(); // Para carregar variáveis de ambiente

app.use(express.json()); // Middleware para parsear JSON do corpo das requisições

// --- Middleware CORS: Crucial para permitir requisições do seu frontend ---
app.use(cors()); // <--- Adicione esta linha AQUI! Ela deve vir antes das suas rotas.

// Rotas da API
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/orders/admin', adminOrderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/product-images', productImageRoutes);
app.use('/api/cupoes', couponRoutes);
app.use('/api/categories', categoryRoutes); // A rota para categorias

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});