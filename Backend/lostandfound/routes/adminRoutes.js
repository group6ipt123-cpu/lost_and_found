const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json({ success: false, message: 'Authentication required' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        next();
    } catch (err) {
        res.json({ success: false, message: 'Invalid token' });
    }
};

const adminAuth = async (req, res, next) => {
    const user = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(req.user.id) });
    if (!user || user.role !== 'admin') return res.json({ success: false, message: 'Admin access required' });
    next();
};

router.get('/stats', auth, adminAuth, async (req, res) => {
    try {
        const users = await mongoose.connection.db.collection('users').countDocuments();
        const items = await mongoose.connection.db.collection('items').countDocuments();
        const pending = await mongoose.connection.db.collection('items').countDocuments({ status: 'pending' });
        const claimed = await mongoose.connection.db.collection('items').countDocuments({ status: 'claimed' });
        const lost = await mongoose.connection.db.collection('items').countDocuments({ category: 'lost' });
        const found = await mongoose.connection.db.collection('items').countDocuments({ category: 'found' });
        res.json({ success: true, data: { users, items: { total: items, lost, found }, pending, claimed } });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const users = await mongoose.connection.db.collection('users').find({}, { projection: { password: 0 } }).sort({ createdAt: -1 }).toArray();
        res.json({ success: true, data: users });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

router.put('/items/:id', auth, adminAuth, async (req, res) => {
    try {
        const result = await mongoose.connection.db.collection('items').findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: { status: req.body.status } }, { returnDocument: 'after' }
        );
        res.json({ success: true, data: result });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

router.delete('/items/:id', auth, adminAuth, async (req, res) => {
    try {
        await mongoose.connection.db.collection('items').deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        res.json({ success: true, message: 'Item deleted' });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

module.exports = router;