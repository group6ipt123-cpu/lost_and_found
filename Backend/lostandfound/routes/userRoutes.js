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

router.get('/profile', auth, async (req, res) => {
    try {
        const user = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(req.user.id) }, { projection: { password: 0 } });
        const itemsReported = await mongoose.connection.db.collection('items').countDocuments({ userId: req.user.id });
        const itemsClaimed = await mongoose.connection.db.collection('items').countDocuments({ claimedBy: req.user.id });
        res.json({ success: true, data: { ...user, stats: { itemsReported, itemsClaimed } } });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

router.put('/profile', auth, async (req, res) => {
    try {
        const { name, studentId, contactNumber } = req.body;
        const result = await mongoose.connection.db.collection('users').findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(req.user.id) }, { $set: { name, studentId, contactNumber } },
            { returnDocument: 'after', projection: { password: 0 } }
        );
        res.json({ success: true, data: result });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

module.exports = router;