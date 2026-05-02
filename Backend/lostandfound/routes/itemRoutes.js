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

router.get('/', async (req, res) => {
    try {
        const items = await mongoose.connection.db.collection('items').find({}).sort({ createdAt: -1 }).toArray();
        res.json({ success: true, count: items.length, data: items });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
    try {
        const item = await mongoose.connection.db.collection('items').findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        if (!item) return res.json({ success: false, message: 'Item not found' });
        res.json({ success: true, data: item });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

router.post('/', auth, async (req, res) => {
    try {
        const user = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(req.user.id) });
        const item = {
            name: req.body.name, description: req.body.description, category: req.body.category,
            itemCategory: req.body.itemCategory, location: req.body.location, date: new Date(req.body.date),
            image: req.body.image || null, status: 'pending', createdAt: new Date(),
            userId: req.user.id, userName: user.name, userEmail: user.email,
            userStudentId: user.studentId || null, userContactNumber: user.contactNumber || null
        };
        const result = await mongoose.connection.db.collection('items').insertOne(item);
        res.json({ success: true, data: { ...item, _id: result.insertedId } });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

router.post('/:itemId/mark-claimed', auth, async (req, res) => {
    try {
        const item = await mongoose.connection.db.collection('items').findOne({ _id: new mongoose.Types.ObjectId(req.params.itemId) });
        if (!item) return res.json({ success: false, message: 'Item not found' });
        if (item.userId !== req.user.id) return res.json({ success: false, message: 'Not authorized' });
        await mongoose.connection.db.collection('items').updateOne({ _id: new mongoose.Types.ObjectId(req.params.itemId) }, { $set: { status: 'claimed', claimedAt: new Date() } });
        res.json({ success: true, message: 'Item marked as claimed' });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

module.exports = router;