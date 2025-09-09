const express = require('express');
const app = express();
const cors = require('cors');
const multer = require('multer'); // ✨ Adicione Multer ✨
const path = require('path');     // ✨ Adicione path ✨
const fs = require('fs');         // ✨ Adicione fs ✨

// Importações das suas rotas
// ... (mantenha todas as suas importações existentes)
const userRoutes = require('./routes/UserRoutes');
const productRoutes = require('./routes/ProductRoutes');
const cartRoutes = require('./routes/CartRoutes');
const orderRoutes = require('./routes/OrderRoutes');
const adminOrderRoutes = require('./routes/AdminOrderRoutes');
const addressRoutes = require('./routes/AddressRoutes');
const paymentRoutes = require('./routes/PaymentRoutes');
const productImageRoutes = require('./routes/ProductImageRoutes');
const couponRoutes = require('./routes/CouponRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const categoryRoutes = require('./routes/CategoryRoutes');
const flavorRoutes = require('./routes/FlavorRoutes');
const pagamentoMultibanco = require('./routes/pagamentoMultibanco');
const pagamentoMbway = require('./routes/pagamentoMbway');
const pagamentoCC = require('./routes/pagamentoCC');
const notificacoes = require('./routes/notificacoes')
const imagensSecundarias = require('./routes/imagensSecundarias');
const reviewsRouter = require('./routes/reviews');
const favoriteRoutes = require('./routes/favoriteRoutes');
const contactRoutes = require('./routes/contactRoutes');
const brandsRoutes = require('./routes/brandRoutes');

require('dotenv').config();

app.use(express.json());

const corsOptions = {
  origin: [
    'https://www.rdpowernutrition.pt',
    'https://powernutrition-fr-git-7a9b89-rodrigo-mirandas-projects-77074af9.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ✨ Lógica de configuração do Multer e da rota de upload de imagens ✨
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Nova rota para o upload de imagens
app.post('/api/images/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum ficheiro foi enviado.' });
    }

    // Retorna o URL completo da imagem guardada
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({ url: imageUrl });
});

// Serve os ficheiros estáticos da pasta de uploads
app.use('/uploads', express.static(uploadDir));

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
app.use('/api/categories', categoryRoutes);
app.use('/api/flavors', flavorRoutes);
app.use('/api/referencia/multibanco',pagamentoMultibanco);
app.use('/api/referencia/mbway',pagamentoMbway);
app.use('/api/referencia/cc',pagamentoCC);
app.use('/api/easypay',notificacoes);
app.use('/api/product_images',imagensSecundarias);
app.use('/api/reviews', reviewsRouter); 
app.use('/api/favorites', favoriteRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/brands', brandsRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});