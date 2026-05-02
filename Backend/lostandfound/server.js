const dns = require('node:dns/promises');
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.PORT || 5000;

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const claimRoutes = require('./routes/claimRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://findera-frontend-app.vercel.app',
        'https://frontend-10pb8b4pm-group6ipt123-3824s-projects.vercel.app',
        'https://lostandfound-three-kohl.vercel.app',
        'https://findera-frontend-prhrunjzk-group6ipt123-3824s-projects.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    optionsSuccessStatus: 200
}));

app.options('*', cors());
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'FindEra API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true
    }
}));

app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/lostandfound', {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

mongoose.connection.on('error', err => console.error('MongoDB connection error:', err));
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));

if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// ============ AUTO STATUS & EXPIRATION ============

const autoExpireItems = async () => {
    try {
        if (mongoose.connection.readyState !== 1) return;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const result = await mongoose.connection.db.collection('items').updateMany(
            { status: 'pending', createdAt: { $lt: thirtyDaysAgo } },
            { $set: { status: 'expired', expiredAt: new Date(), autoUpdated: true } }
        );
        if (result.modifiedCount > 0) console.log(`Auto-expired ${result.modifiedCount} items`);
    } catch (err) { console.error('Auto-expire error:', err); }
};

setInterval(autoExpireItems, 6 * 60 * 60 * 1000);

app.get('/api/items/expiring-soon', async (req, res) => {
    try {
        const now = new Date();
        const twentyThreeDaysAgo = new Date();
        twentyThreeDaysAgo.setDate(twentyThreeDaysAgo.getDate() - 23);
        const items = await mongoose.connection.db.collection('items')
            .find({ status: 'pending', createdAt: { $gte: twentyThreeDaysAgo } })
            .sort({ createdAt: -1 }).toArray();
        const itemsWithExpiry = items.map(item => {
            const created = new Date(item.createdAt);
            const expiry = new Date(created);
            expiry.setDate(expiry.getDate() + 30);
            const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            return { ...item, daysRemaining, expiryDate: expiry, isExpiringSoon: daysRemaining <= 7 };
        });
        res.json({ success: true, count: itemsWithExpiry.length, data: itemsWithExpiry });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.get('/api/items/:id/expiry', async (req, res) => {
    try {
        const item = await mongoose.connection.db.collection('items').findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
        const created = new Date(item.createdAt);
        const expiry = new Date(created);
        expiry.setDate(expiry.getDate() + 30);
        const daysRemaining = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
        res.json({ success: true, data: { ...item, daysRemaining, expiryDate: expiry, isExpired: daysRemaining <= 0, isExpiringSoon: daysRemaining <= 7 && daysRemaining > 0 } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/items/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'claimed', 'verified', 'ready_for_pickup', 'closed', 'expired'];
        if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
        const updateData = { status, updatedAt: new Date() };
        if (status === 'claimed') updateData.claimedAt = new Date();
        if (status === 'verified') updateData.verifiedAt = new Date();
        if (status === 'closed') updateData.closedAt = new Date();
        if (status === 'expired') updateData.expiredAt = new Date();
        const result = await mongoose.connection.db.collection('items').findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: updateData }, { returnDocument: 'after' }
        );
        if (!result) return res.status(404).json({ success: false, message: 'Item not found' });
        res.json({ success: true, data: result });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ============ HOME & HEALTH ============

app.get('/', (req, res) => {
    res.json({
        name: 'FindEra API',
        version: '1.0.0',
        status: 'active',
        endpoints: {
            documentation: '/api-docs',
            swaggerJson: '/swagger.json',
            auth: '/api/auth',
            items: '/api/items',
            claims: '/api/claims',
            chat: '/api/chat',
            notifications: '/api/notifications',
            users: '/api/users',
            admin: '/api/admin'
        },
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// ============ DATABASE INIT ============

mongoose.connection.once('open', async () => {
    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const names = collections.map(c => c.name);
        for (const collection of ['chatrooms', 'messages', 'notifications']) {
            if (!names.includes(collection)) {
                await db.createCollection(collection);
                console.log(`Created collection: ${collection}`);
            }
        }
        await db.collection('items').createIndex({ title: 'text', description: 'text' });
        await db.collection('items').createIndex({ type: 1, status: 1 });
        await db.collection('items').createIndex({ createdAt: -1 });
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('notifications').createIndex({ userId: 1, createdAt: -1 });
        await db.collection('messages').createIndex({ roomId: 1, createdAt: 1 });
        console.log('Database ready');
        await autoExpireItems();
    } catch (err) { console.error('Database init error:', err); }
});

// ============ ERROR HANDLERS ============

app.use((req, res) => {
    res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.url}`, error: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Validation error', errors: Object.values(err.errors).map(e => e.message) });
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid ID format' });
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Duplicate key error' });
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    const server = app.listen(PORT, () => {
        console.log(`\n========================================`);
        console.log(`FindEra API Running`);
        console.log(`Server: http://localhost:${PORT}`);
        console.log(`Swagger: http://localhost:${PORT}/api-docs`);
        console.log(`Health: http://localhost:${PORT}/health`);
        console.log(`========================================\n`);
    });
    const gracefulShutdown = () => {
        console.log('\nShutting down...');
        server.close(async () => {
            await mongoose.connection.close();
            console.log('Server closed');
            process.exit(0);
        });
    };
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
}