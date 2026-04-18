const Claim = require('../models/Claim');
const Item = require('../models/Item');

// @desc    Submit a claim on a found item
// @route   POST /api/claims
// @access  Private (students)
const createClaim = async (req, res) => {
  try {
    const { itemId, message } = req.body;

    // --- Input Validation ---
    if (!itemId || !message) {
      return res.status(400).json({ message: 'Item ID and message are required' });
    }

    if (typeof message !== 'string' || message.trim().length < 10) {
      return res.status(400).json({ message: 'Message must be at least 10 characters' });
    }
    // --- End Validation ---

    // Check if item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Only allow claims on 'found' items
    if (item.status !== 'found') {
      return res.status(400).json({
        message: `Cannot claim an item with status "${item.status}". Only "found" items can be claimed.`,
      });
    }

    // Prevent the reporter from claiming their own item
    if (item.reportedBy.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot claim an item you reported' });
    }

    // Check if this user already submitted a claim for this item
    const existingClaim = await Claim.findOne({ item: itemId, claimedBy: req.user.id });
    if (existingClaim) {
      return res.status(400).json({ message: 'You have already submitted a claim for this item' });
    }

    const claim = await Claim.create({
      item: itemId,
      claimedBy: req.user.id,
      message: message.trim(),
    });

    await claim.populate([
      { path: 'item', select: 'title category location status' },
      { path: 'claimedBy', select: 'name email' },
    ]);

    res.status(201).json({ message: 'Claim submitted successfully', claim });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID format' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get all claims (admin) or own claims (student)
// @route   GET /api/claims
// @access  Private
const getAllClaims = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { claimedBy: req.user.id };

    const claims = await Claim.find(filter)
      .populate('item', 'title category location status')
      .populate('claimedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: claims.length, claims });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get all claims for a specific item (admin only)
// @route   GET /api/claims/item/:itemId
// @access  Private (Admin)
const getClaimsByItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const claims = await Claim.find({ item: req.params.itemId })
      .populate('claimedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: claims.length, claims });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID format' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Approve a claim → auto-sets item status to 'claimed'
// @route   PUT /api/claims/:id/approve
// @access  Private (Admin)
const approveClaim = async (req, res) => {
  try {
    const { adminNote } = req.body;

    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({
        message: `Claim has already been ${claim.status}`,
      });
    }

    // AUTO STATUS UPDATE (Task 3.5) - mark item as claimed
    const item = await Item.findById(claim.item);
    if (!item) {
      return res.status(404).json({ message: 'Associated item not found' });
    }

    if (item.status === 'claimed') {
      return res.status(400).json({ message: 'This item has already been claimed' });
    }

    // Update claim status
    claim.status = 'approved';
    claim.adminNote = adminNote ? adminNote.trim() : 'Claim approved by admin';
    await claim.save();

    // Auto-update item status to 'claimed'
    item.status = 'claimed';
    await item.save();

    // Reject all other pending claims for this item
    await Claim.updateMany(
      { item: claim.item, _id: { $ne: claim._id }, status: 'pending' },
      { status: 'rejected', adminNote: 'Another claim was approved for this item' }
    );

    await claim.populate([
      { path: 'item', select: 'title category location status' },
      { path: 'claimedBy', select: 'name email' },
    ]);

    res.status(200).json({
      message: `Claim approved. Item "${item.title}" has been marked as claimed.`,
      claim,
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid claim ID format' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Reject a claim
// @route   PUT /api/claims/:id/reject
// @access  Private (Admin)
const rejectClaim = async (req, res) => {
  try {
    const { adminNote } = req.body;

    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({
        message: `Claim has already been ${claim.status}`,
      });
    }

    claim.status = 'rejected';
    claim.adminNote = adminNote ? adminNote.trim() : 'Claim rejected by admin';
    await claim.save();

    await claim.populate([
      { path: 'item', select: 'title category location status' },
      { path: 'claimedBy', select: 'name email' },
    ]);

    res.status(200).json({ message: 'Claim rejected', claim });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid claim ID format' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createClaim, getAllClaims, getClaimsByItem, approveClaim, rejectClaim };