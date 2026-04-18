const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['claim_update', 'item_found', 'verification', 'pickup_ready', 'system', 'inquiry', 'inquiry_reply'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        default: null
    },
    claim: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Claim',
        default: null
    },
    inquiry: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inquiry',
        default: null
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);