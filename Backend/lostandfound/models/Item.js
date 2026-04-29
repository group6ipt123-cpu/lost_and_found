const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add an item name']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    category: {
        type: String,
        enum: ['lost', 'found'],
        required: [true, 'Please specify category']
    },
    itemCategory: {
        type: String,
        default: 'Others'
    },
    location: {
        type: String,
        required: [true, 'Please add location']
    },
    date: {
        type: Date,
        required: [true, 'Please add date']
    },
    image: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'claimed', 'verified', 'ready_for_pickup', 'closed'],
        default: 'pending'
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.Item || mongoose.model('Item', itemSchema);