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

router.get('/', auth, async (req, res) => {
    try {
        const notifications = await mongoose.connection.db.collection('notifications').find({ userId: req.user.id }).sort({ createdAt: -1 }).toArray();
        const unreadCount = notifications.filter(n => !n.isRead).length;
        res.json({ success: true, data: notifications, unreadCount });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

router.put('/:id/read', async (req, res) => {
    try {
        await mongoose.connection.db.collection('notifications').updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: { isRead: true } });
        res.json({ success: true });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

router.put('/read-all', auth, async (req, res) => {
    try {
        await mongoose.connection.db.collection('notifications').updateMany({ userId: req.user.id, isRead: false }, { $set: { isRead: true } });
        res.json({ success: true });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

module.exports = router;