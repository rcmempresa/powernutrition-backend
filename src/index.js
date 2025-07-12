const express = require('express');
const app = express();
const userRoutes = require('./routes/UserRoutes');
const productRoutes = require('./routes/ProductRoutes');
const cartRoutes = require('./routes/CartRoutes');
const orderRoutes = require('./routes/OrderRoutes'); 
const adminOrderRoutes = require('./routes/AdminOrderRoutes');
const addressRoutes = require('./routes/AddressRoutes');
const paymentRoutes = require('./routes/PaymentRoutes');
const productImageRoutes = require('./routes/ProductImageRoutes'); // ⬅️ novo
require('dotenv').config();

app.use(express.json());

// Rotas da API
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/orders/admin', adminOrderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/product-images', productImageRoutes); // ⬅️ novo

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});
