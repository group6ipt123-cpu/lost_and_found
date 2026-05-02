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

const createNotification = async (userId, type, title, message, relatedItemId, relatedItemName, senderId = null) => {
    const notification = { userId, type, title, message, relatedItemId, relatedItemName, senderId, isRead: false, createdAt: new Date() };
    const result = await mongoose.connection.db.collection('notifications').insertOne(notification);
    return { ...notification, _id: result.insertedId };
};

// Create or get chat room
router.post('/room', auth, async (req, res) => {
    try {
        const { itemId, ownerId } = req.body;
        let room = await mongoose.connection.db.collection('chatrooms').findOne({ itemId, participants: { $all: [req.user.id, ownerId] } });
        if (!room) {
            const newRoom = { itemId, participants: [req.user.id, ownerId], createdAt: new Date(), lastMessage: null, lastMessageTime: null };
            const result = await mongoose.connection.db.collection('chatrooms').insertOne(newRoom);
            room = { ...newRoom, _id: result.insertedId };
        }
        const item = await mongoose.connection.db.collection('items').findOne({ _id: new mongoose.Types.ObjectId(itemId) });
        const otherId = room.participants.find(p => p !== req.user.id);
        const otherUser = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(otherId) }, { projection: { password: 0 } });
        const messages = await mongoose.connection.db.collection('messages').find({ roomId: room._id.toString() }).sort({ createdAt: 1 }).toArray();
        res.json({ success: true, data: { ...room, item, otherUser, messages } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Get all chat rooms for user
router.get('/rooms', auth, async (req, res) => {
    try {
        const rooms = await mongoose.connection.db.collection('chatrooms').find({ participants: req.user.id }).sort({ lastMessageTime: -1 }).toArray();
        const enriched = [];
        for (const room of rooms) {
            const item = await mongoose.connection.db.collection('items').findOne({ _id: new mongoose.Types.ObjectId(room.itemId) });
            const otherId = room.participants.find(p => p !== req.user.id);
            const otherUser = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(otherId) }, { projection: { password: 0 } });
            enriched.push({ ...room, item, otherUser });
        }
        res.json({ success: true, data: enriched });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

// Get messages for a room
router.get('/messages/:roomId', auth, async (req, res) => {
    try {
        const room = await mongoose.connection.db.collection('chatrooms').findOne({ _id: new mongoose.Types.ObjectId(req.params.roomId), participants: req.user.id });
        if (!room) return res.status(403).json({ success: false, message: 'Access denied' });
        const messages = await mongoose.connection.db.collection('messages').find({ roomId: req.params.roomId }).sort({ createdAt: 1 }).toArray();
        res.json({ success: true, data: messages });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Send message
router.post('/message', auth, async (req, res) => {
    try {
        const { roomId, message } = req.body;
        if (!message || !message.trim()) return res.status(400).json({ success: false, message: 'Message required' });
        
        const room = await mongoose.connection.db.collection('chatrooms').findOne({ _id: new mongoose.Types.ObjectId(roomId), participants: req.user.id });
        if (!room) return res.status(403).json({ success: false, message: 'Access denied' });
        
        const sender = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(req.user.id) });
        const item = await mongoose.connection.db.collection('items').findOne({ _id: new mongoose.Types.ObjectId(room.itemId) });
        
        const newMessage = { roomId, senderId: req.user.id, senderName: sender.name, message: message.trim(), createdAt: new Date(), read: false };
        const result = await mongoose.connection.db.collection('messages').insertOne(newMessage);
        
        await mongoose.connection.db.collection('chatrooms').updateOne({ _id: new mongoose.Types.ObjectId(roomId) }, { $set: { lastMessage: message.trim(), lastMessageTime: new Date() } });
        
        // Notify other participant
        const otherId = room.participants.find(p => p !== req.user.id);
        if (otherId) {
            await createNotification(otherId, 'new_message', 'New Message', `${sender.name} sent you a message about "${item?.name || 'an item'}"`, room.itemId, item?.name || 'Item', req.user.id);
        }
        
        res.json({ success: true, data: { ...newMessage, _id: result.insertedId } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Mark messages as read
router.put('/messages/read/:roomId', auth, async (req, res) => {
    try {
        await mongoose.connection.db.collection('messages').updateMany({ roomId: req.params.roomId, senderId: { $ne: req.user.id }, read: false }, { $set: { read: true } });
        res.json({ success: true });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

module.exports = router;