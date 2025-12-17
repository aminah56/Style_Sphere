const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
console.log('Stripe Key loaded:', process.env.STRIPE_SECRET_KEY ? 'Yes' : 'No');
if (!process.env.STRIPE_SECRET_KEY) {
    console.error('CRITICAL: STRIPE_SECRET_KEY is missing from environment variables.');
}

const { getPool } = require('./db');
const authRoutes = require('./routes/auth');
const catalogRoutes = require('./routes/catalog');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const ordersRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static images from the images directory at project root
// Add middleware to handle URL-encoded paths (spaces as %20)
app.use('/images', (req, res, next) => {
    req.url = decodeURIComponent(req.url);
    next();
}, express.static(path.resolve(__dirname, '../../images')));

app.get('/api/health', async (_req, res) => {
    try {
        await getPool();
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

const userRoutes = require('./routes/user'); // Add this import

// ...

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // Add this usage



app.use('/api/catalog', catalogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', require('./routes/payment'));
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', ordersRoutes);

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});

