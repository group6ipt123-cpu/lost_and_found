const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');
const Item = require('../models/Item');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/claims/:itemId
// @desc    File a claim for an item
// @access  Private (User only)
router.post('/:itemId', protect, authorize('user'), async (req, res) => {
    try {
        const item = await Item.findById(req.params.itemId);
        
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        if (item.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'This item is no longer available for claim' });
        }

        // Check if user already filed a claim
        const existingClaim = await Claim.findOne({
            item: item._id,
            claimedBy: req.user.id
        });

        if (existingClaim) {
            return res.status(400).json({ success: false, message: 'You already filed a claim for this item' });
        }

        // Create claim
        const claim = await Claim.create({
            item: item._id,
            claimedBy: req.user.id,
            proofDescription: req.body.proofDescription
        });

        // Update item status
        item.status = 'claimed';
        item.claimedBy = req.user.id;
        item.claimRequestedAt = Date.now();
        await item.save();

        // Notify item owner
        await Notification.create({
            recipient: item.reportedBy,
            type: 'claim_update',
            title: 'New Claim Filed',
            message: `${req.user.name} filed a claim for "${item.name}"`,
            item: item._id,
            claim: claim._id
        });

        // Notify admins
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            await Notification.create({
                recipient: admin._id,
                type: 'claim_update',
                title: 'New Claim Requires Review',
                message: `${req.user.name} filed a claim for "${item.name}"`,
                item: item._id,
                claim: claim._id
            });
        }

        res.status(201).json({ success: true, data: claim });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// @route   GET /api/claims
// @desc    Get all claims (Admin sees all, User sees their own)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role !== 'admin') {
            query.claimedBy = req.user.id;
        }

        const claims = await Claim.find(query)
            .populate('item')
            .populate('claimedBy', 'name email')
            .populate('reviewedBy', 'name')
            .sort('-createdAt');

        res.status(200).json({ success: true, count: claims.length, data: claims });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/claims/:claimId/verify
// @desc    Verify a claim (Admin only)
// @access  Private/Admin
router.put('/:claimId/verify', protect, authorize('admin'), async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        
        const claim = await Claim.findById(req.params.claimId)
            .populate('item')
            .populate('claimedBy');

        if (!claim) {
            return res.status(404).json({ success: false, message: 'Claim not found' });
        }

        claim.status = status;
        claim.adminNote = adminNote;
        claim.reviewedBy = req.user.id;
        claim.reviewedAt = Date.now();
        await claim.save();

        // Update item status
        const item = await Item.findById(claim.item._id);
        
        if (status === 'verified' || status === 'approved') {
            item.status = 'verified';
            item.verifiedBy = req.user.id;
            item.verifiedAt = Date.now();
            
            // Notify claimant
            await Notification.create({
                recipient: claim.claimedBy._id,
                type: 'verification',
                title: 'Claim Verified!',
                message: `Your claim for "${item.name}" has been verified. Please proceed to claim your item.`,
                item: item._id,
                claim: claim._id
            });
        } else if (status === 'ready_for_pickup') {
            item.status = 'ready_for_pickup';
            
            await Notification.create({
                recipient: claim.claimedBy._id,
                type: 'pickup_ready',
                title: 'Item Ready for Pickup!',
                message: `"${item.name}" is now ready for pickup. Please visit the lost and found office.`,
                item: item._id,
                claim: claim._id
            });
        } else if (status === 'rejected') {
            item.status = 'pending';
            item.claimedBy = null;
            item.claimRequestedAt = null;
            
            await Notification.create({
                recipient: claim.claimedBy._id,
                type: 'verification',
                title: 'Claim Not Verified',
                message: `Your claim for "${item.name}" could not be verified. Reason: ${adminNote || 'Insufficient proof'}`,
                item: item._id,
                claim: claim._id
            });
        }

        await item.save();

        res.status(200).json({ success: true, data: claim });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;