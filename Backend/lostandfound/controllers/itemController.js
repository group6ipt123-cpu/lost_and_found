const Item = require('../models/Item');

const VALID_CATEGORIES = ['electronics', 'clothing', 'accessories', 'books', 'documents', 'others'];
const VALID_STATUSES = ['lost', 'found', 'claimed'];

// Helper: validate URL format (for image field)
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// @desc    Report a new lost/found item
// @route   POST /api/items
// @access  Private (logged-in users)
const createItem = async (req, res) => {
  try {
    const { title, description, category, status, location, image } = req.body;

    // --- Input Validation ---
    if (!title || !description || !category || !location) {
      return res.status(400).json({ message: 'Title, description, category, and location are required' });
    }

    if (typeof title !== 'string' || title.trim().length < 2) {
      return res.status(400).json({ message: 'Title must be at least 2 characters' });
    }

    if (typeof description !== 'string' || description.trim().length < 5) {
      return res.status(400).json({ message: 'Description must be at least 5 characters' });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    if (typeof location !== 'string' || location.trim().length < 2) {
      return res.status(400).json({ message: 'Location must be at least 2 characters' });
    }

    if (image && !isValidUrl(image)) {
      return res.status(400).json({ message: 'Image must be a valid URL' });
    }
    // --- End Validation ---

    const item = await Item.create({
      title: title.trim(),
      description: description.trim(),
      category,
      status: status || 'lost',
      location: location.trim(),
      image: image || null,
      reportedBy: req.user.id,
    });

    res.status(201).json({ message: 'Item reported successfully', item });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get all items (with optional filters)
// @route   GET /api/items
// @access  Public
const getAllItems = async (req, res) => {
  try {
    const { status, category, location } = req.query;

    // --- Query Validation ---
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Status filter must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: `Category filter must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }
    // --- End Validation ---

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (location) filter.location = { $regex: location.trim(), $options: 'i' };

    const items = await Item.find(filter)
      .populate('reportedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get a single item by ID
// @route   GET /api/items/:id
// @access  Public
const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email role');

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({ item });
  } catch (err) {
    // Handle invalid MongoDB ObjectId format
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID format' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update an item (owner or admin only)
// @route   PUT /api/items/:id
// @access  Private
const updateItem = async (req, res) => {
  try {
    const { title, description, category, status, location, image } = req.body;

    // --- Input Validation (only validate fields that were sent) ---
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'No fields provided to update' });
    }

    if (title !== undefined && (typeof title !== 'string' || title.trim().length < 2)) {
      return res.status(400).json({ message: 'Title must be at least 2 characters' });
    }

    if (description !== undefined && (typeof description !== 'string' || description.trim().length < 5)) {
      return res.status(400).json({ message: 'Description must be at least 5 characters' });
    }

    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      });
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    if (location !== undefined && (typeof location !== 'string' || location.trim().length < 2)) {
      return res.status(400).json({ message: 'Location must be at least 2 characters' });
    }

    if (image !== undefined && image !== null && !isValidUrl(image)) {
      return res.status(400).json({ message: 'Image must be a valid URL' });
    }
    // --- End Validation ---

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Only the reporter or an admin can update
    if (item.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this item' });
    }

    // Sanitize string fields before saving
    const sanitizedBody = { ...req.body };
    if (title) sanitizedBody.title = title.trim();
    if (description) sanitizedBody.description = description.trim();
    if (location) sanitizedBody.location = location.trim();

    const updated = await Item.findByIdAndUpdate(req.params.id, sanitizedBody, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ message: 'Item updated successfully', item: updated });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID format' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete an item (admin only)
// @route   DELETE /api/items/:id
// @access  Private (Admin)
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await item.deleteOne();

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID format' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { createItem, getAllItems, getItemById, updateItem, deleteItem };