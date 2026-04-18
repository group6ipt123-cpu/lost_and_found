const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const Inquiry = require('../models/Inquiry');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        const itemsReported = await Item.countDocuments({ reportedBy: req.user.id });
        const itemsClaimed = await Claim.countDocuments({ claimedBy: req.user.id });
        const activeInquiries = await Inquiry.countDocuments({ 
            $or: [{ sender: req.user.id }, { receiver: req.user.id }],
            status: { $in: ['pending', 'replied'] }
        });

        res.status(200).json({
            success: true,
            data: {
                ...user.toObject(),
                stats: { itemsReported, itemsClaimed, activeInquiries }
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, studentId, contactNumber, currentPassword, newPassword } = req.body;
        
        const user = await User.findById(req.user.id).select('+password');
        
        // Update basic info
        user.name = name || user.name;
        user.studentId = studentId || user.studentId;
        user.contactNumber = contactNumber || user.contactNumber;
        
        // Update password if provided
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Current password required' });
            }
            
            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Current password is incorrect' });
            }
            
            user.password = newPassword;
        }
        
        await user.save();
        
        const updatedUser = await User.findById(req.user.id).select('-password');
        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/users/items:
 *   get:
 *     summary: Get user's reported items
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/items', protect, async (req, res) => {
    try {
        const items = await Item.find({ reportedBy: req.user.id }).sort('-createdAt');
        res.status(200).json({ success: true, data: items });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/users/claims:
 *   get:
 *     summary: Get user's claims
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/claims', protect, async (req, res) => {
    try {
        const claims = await Claim.find({ claimedBy: req.user.id })
            .populate('item', 'name category location status')
            .sort('-createdAt');
        res.status(200).json({ success: true, data: claims });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/users/activity:
 *   get:
 *     summary: Get user activity summary
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/activity', protect, async (req, res) => {
    try {
        const recentItems = await Item.find({ reportedBy: req.user.id })
            .sort('-createdAt')
            .limit(5);
            
        const recentClaims = await Claim.find({ claimedBy: req.user.id })
            .populate('item', 'name')
            .sort('-createdAt')
            .limit(5);
            
        const recentInquiries = await Inquiry.find({
            $or: [{ sender: req.user.id }, { receiver: req.user.id }]
        })
            .populate('item', 'name')
            .populate('sender', 'name')
            .populate('receiver', 'name')
            .sort('-createdAt')
            .limit(5);

        res.status(200).json({
            success: true,
            data: { recentItems, recentClaims, recentInquiries }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;