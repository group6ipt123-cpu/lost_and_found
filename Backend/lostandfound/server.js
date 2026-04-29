require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017/lostandfound')
    .then(() => console.log('Database connected'))
    .catch(err => console.error('DB Error:', err));

// ============ AUTH ROUTES ============

// REGISTER
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, studentId, contactNumber } = req.body;
        const existing = await mongoose.connection.db.collection('users').findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.json({ success: false, message: 'User already exists' });
        }
        
        const user = { name, email: email.toLowerCase(), password, studentId, contactNumber, role: 'user', createdAt: new Date() };
        await mongoose.connection.db.collection('users').insertOne(user);
        res.json({ success: true, message: 'Registration successful' });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await mongoose.connection.db.collection('users').findOne({ email: email.toLowerCase(), password });
        if (!user) return res.json({ success: false, message: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, studentId: user.studentId, contactNumber: user.contactNumber } });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// GET CURRENT USER
app.get('/api/auth/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.json({ success: false, message: 'Authentication required' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await mongoose.connection.db.collection('users').findOne(
            { _id: new mongoose.Types.ObjectId(decoded.id) },
            { projection: { password: 0 } }
        );
        if (!user) return res.json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        res.json({ success: false, message: 'Invalid token' });
    }
});

// ============ ITEMS ROUTES ============

// GET all items
app.get('/api/items', async (req, res) => {
    try {
        const items = await mongoose.connection.db.collection('items').find({}).sort({ createdAt: -1 }).toArray();
        res.json({ success: true, count: items.length, data: items });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// GET single item
app.get('/api/items/:id', async (req, res) => {
    try {
        const item = await mongoose.connection.db.collection('items').findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        if (!item) return res.json({ success: false, message: 'Item not found' });
        res.json({ success: true, data: item });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// POST create item
app.post('/api/items', async (req, res) => {
    try {
        const item = {
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            itemCategory: req.body.itemCategory,
            location: req.body.location,
            date: new Date(req.body.date),
            image: req.body.image || null,
            status: 'pending',
            claimedBy: null,
            createdAt: new Date()
        };
        const result = await mongoose.connection.db.collection('items').insertOne(item);
        res.json({ success: true, data: { ...item, _id: result.insertedId } });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// PUT update item
app.put('/api/items/:id', async (req, res) => {
    try {
        const result = await mongoose.connection.db.collection('items').findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(req.params.id) },
            { $set: req.body },
            { returnDocument: 'after' }
        );
        if (!result) return res.json({ success: false, message: 'Item not found' });
        res.json({ success: true, data: result });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// DELETE item
app.delete('/api/items/:id', async (req, res) => {
    try {
        const result = await mongoose.connection.db.collection('items').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        if (result.deletedCount === 0) return res.json({ success: false, message: 'Item not found' });
        res.json({ success: true, message: 'Item deleted' });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// ============ CLAIM ROUTE ============

// POST claim item
app.post('/api/claims/:itemId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.json({ success: false, message: 'Authentication required' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        
        const item = await mongoose.connection.db.collection('items').findOne({ _id: new mongoose.Types.ObjectId(req.params.itemId) });
        if (!item) return res.json({ success: false, message: 'Item not found' });
        if (item.status === 'claimed') return res.json({ success: false, message: 'Item already claimed' });
        
        const result = await mongoose.connection.db.collection('items').findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(req.params.itemId) },
            { $set: { status: 'claimed', claimedBy: decoded.id, claimRequestedAt: new Date() } },
            { returnDocument: 'after' }
        );
        res.json({ success: true, data: result });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// ============ USER ROUTES ============

// GET profile
app.get('/api/users/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.json({ success: false, message: 'Authentication required' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await mongoose.connection.db.collection('users').findOne(
            { _id: new mongoose.Types.ObjectId(decoded.id) },
            { projection: { password: 0 } }
        );
        if (!user) return res.json({ success: false, message: 'User not found' });
        
        const itemsReported = await mongoose.connection.db.collection('items').countDocuments({ reportedBy: decoded.id });
        const itemsClaimed = await mongoose.connection.db.collection('items').countDocuments({ claimedBy: decoded.id });
        
        res.json({ success: true, data: { ...user, stats: { itemsReported, itemsClaimed } } });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// PUT update profile
app.put('/api/users/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.json({ success: false, message: 'Authentication required' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const { name, studentId, contactNumber } = req.body;
        
        const result = await mongoose.connection.db.collection('users').findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(decoded.id) },
            { $set: { name, studentId, contactNumber } },
            { returnDocument: 'after', projection: { password: 0 } }
        );
        
        res.json({ success: true, data: result });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// ============ ADMIN ROUTES ============

// GET admin stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.json({ success: false, message: 'Authentication required' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const adminUser = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(decoded.id) });
        
        if (!adminUser || adminUser.role !== 'admin') {
            return res.json({ success: false, message: 'Admin access required' });
        }
        
        const totalUsers = await mongoose.connection.db.collection('users').countDocuments();
        const totalItems = await mongoose.connection.db.collection('items').countDocuments();
        const pendingItems = await mongoose.connection.db.collection('items').countDocuments({ status: 'pending' });
        const claimedItems = await mongoose.connection.db.collection('items').countDocuments({ status: 'claimed' });
        const lostItems = await mongoose.connection.db.collection('items').countDocuments({ category: 'lost' });
        const foundItems = await mongoose.connection.db.collection('items').countDocuments({ category: 'found' });
        
        res.json({
            success: true,
            data: {
                users: totalUsers,
                items: { total: totalItems, lost: lostItems, found: foundItems },
                pending: pendingItems,
                claimed: claimedItems
            }
        });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// GET all users (admin)
app.get('/api/admin/users', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.json({ success: false, message: 'Authentication required' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const adminUser = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(decoded.id) });
        
        if (!adminUser || adminUser.role !== 'admin') {
            return res.json({ success: false, message: 'Admin access required' });
        }
        
        const users = await mongoose.connection.db.collection('users').find({}, { projection: { password: 0 } }).sort({ createdAt: -1 }).toArray();
        res.json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// PUT update item status (admin)
app.put('/api/admin/items/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.json({ success: false, message: 'Authentication required' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const adminUser = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(decoded.id) });
        
        if (!adminUser || adminUser.role !== 'admin') {
            return res.json({ success: false, message: 'Admin access required' });
        }
        
        const result = await mongoose.connection.db.collection('items').findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(req.params.id) },
            { $set: { status: req.body.status, verifiedAt: new Date() } },
            { returnDocument: 'after' }
        );
        if (!result) return res.json({ success: false, message: 'Item not found' });
        res.json({ success: true, data: result });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// DELETE item (admin)
app.delete('/api/admin/items/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.json({ success: false, message: 'Authentication required' });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const adminUser = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(decoded.id) });
        
        if (!adminUser || adminUser.role !== 'admin') {
            return res.json({ success: false, message: 'Admin access required' });
        }
        
        await mongoose.connection.db.collection('items').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        res.json({ success: true, message: 'Item deleted' });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// ============ HOME ============
app.get('/', (req, res) => res.send('Lost and Found API running'));

// ============ SWAGGER ============
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Lost and Found API',
            version: '1.0.0',
            description: 'Complete API for Lost and Found System'
        },
        servers: [{ url: `http://localhost:${PORT}`, description: 'Local server' }],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            }
        },
        paths: {
            '/api/auth/register': {
                post: {
                    tags: ['Auth'],
                    summary: 'Register new user',
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        email: { type: 'string' },
                                        password: { type: 'string' },
                                        studentId: { type: 'string' },
                                        contactNumber: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: { '200': { description: 'Success' } }
                }
            },
            '/api/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login user',
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string' },
                                        password: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: { '200': { description: 'Login successful' } }
                }
            },
            '/api/items': {
                get: { tags: ['Items'], summary: 'Get all items', responses: { '200': { description: 'List of items' } } },
                post: { tags: ['Items'], summary: 'Create item', responses: { '201': { description: 'Item created' } } }
            },
            '/api/claims/{itemId}': {
                post: {
                    tags: ['Claims'],
                    summary: 'Claim an item',
                    parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { '200': { description: 'Item claimed' } }
                }
            },
            '/api/users/profile': {
                get: { tags: ['Users'], summary: 'Get profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'User profile' } } },
                put: { tags: ['Users'], summary: 'Update profile', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Profile updated' } } }
            },
            '/api/admin/stats': {
                get: { tags: ['Admin'], summary: 'Get system stats', security: [{ bearerAuth: [] }], responses: { '200': { description: 'System statistics' } } }
            },
            '/api/admin/users': {
                get: { tags: ['Admin'], summary: 'Get all users', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of users' } } }
            }
        }
    },
    apis: []
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ============ SERVER ============
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));