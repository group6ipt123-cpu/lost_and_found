const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const Inquiry = require('../models/Inquiry');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin access
router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get system statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalItems = await Item.countDocuments();
        const pendingClaims = await Claim.countDocuments({ status: 'pending' });
        const pendingInquiries = await Inquiry.countDocuments({ status: 'pending' });
        const lostItems = await Item.countDocuments({ category: 'lost' });
        const foundItems = await Item.countDocuments({ category: 'found' });
        const claimedItems = await Item.countDocuments({ status: 'claimed' });
        const resolvedItems = await Item.countDocuments({ status: 'ready_for_pickup' });

        res.status(200).json({
            success: true,
            data: {
                users: totalUsers,
                items: { total: totalItems, lost: lostItems, found: foundItems },
                claims: { pending: pendingClaims, claimed: claimedItems },
                inquiries: { pending: pendingInquiries },
                resolved: resolvedItems
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort('-createdAt');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/admin/users/:id:
 *   put:
 *     summary: Update user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put('/users/:id', async (req, res) => {
    try {
        const { role, name, studentId, contactNumber } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role, name, studentId, contactNumber },
            { new: true, runValidators: true }
        ).select('-password');
        
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/admin/users/:id:
 *   delete:
 *     summary: Delete user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/admin/items:
 *   get:
 *     summary: Get all items (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/items', async (req, res) => {
    try {
        const items = await Item.find()
            .populate('reportedBy', 'name email')
            .populate('claimedBy', 'name email')
            .sort('-createdAt');
        res.status(200).json({ success: true, count: items.length, data: items });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/admin/items/:id:
 *   put:
 *     summary: Update item status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put('/items/:id', async (req, res) => {
    try {
        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { ...req.body, verifiedBy: req.user.id, verifiedAt: Date.now() },
            { new: true }
        );
        
        // Notify user
        await Notification.create({
            recipient: item.reportedBy,
            type: 'verification',
            title: 'Item Status Updated',
            message: `Your item "${item.name}" status changed to ${item.status}`,
            item: item._id
        });
        
        res.status(200).json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/admin/items/:id:
 *   delete:
 *     summary: Delete item
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/items/:id', async (req, res) => {
    try {
        await Item.findByIdAndDelete(req.params.id);
        await Claim.deleteMany({ item: req.params.id });
        await Inquiry.deleteMany({ item: req.params.id });
        res.status(200).json({ success: true, message: 'Item and related data deleted' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: Generate system report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports', async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        const newItems = await Item.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        const resolvedItems = await Item.countDocuments({ 
            status: { $in: ['ready_for_pickup', 'closed'] },
            updatedAt: { $gte: thirtyDaysAgo }
        });
        
        const itemsByCategory = await Item.aggregate([
            { $group: { _id: '$itemCategory', count: { $sum: 1 } } }
        ]);
        
        const itemsByLocation = await Item.aggregate([
            { $group: { _id: '$location', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                period: 'Last 30 days',
                newUsers,
                newItems,
                resolvedItems,
                resolutionRate: newItems > 0 ? ((resolvedItems / newItems) * 100).toFixed(1) + '%' : '0%',
                itemsByCategory,
                itemsByLocation
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;