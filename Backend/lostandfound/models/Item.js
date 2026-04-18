const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - category
 *         - status
 *         - location
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         title:
 *           type: string
 *           description: Short title of the item
 *           example: Black Umbrella
 *         description:
 *           type: string
 *           description: Detailed description of the item
 *           example: Black folding umbrella with a wooden handle
 *         category:
 *           type: string
 *           enum: [electronics, clothing, accessories, books, documents, others]
 *           example: accessories
 *         status:
 *           type: string
 *           enum: [lost, found, claimed]
 *           example: lost
 *         location:
 *           type: string
 *           description: Where the item was lost or found
 *           example: Library 2nd Floor
 *         image:
 *           type: string
 *           description: Image URL of the item
 *           example: https://example.com/image.jpg
 *         reportedBy:
 *           type: string
 *           description: User ID of the reporter
 *         createdAt:
 *           type: string
 *           format: date-time
 */

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['electronics', 'clothing', 'accessories', 'books', 'documents', 'others'],
      required: [true, 'Category is required'],
    },
    status: {
      type: String,
      enum: ['lost', 'found', 'claimed'],
      default: 'lost',
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Task 3.3 - Indexing for faster queries
itemSchema.index({ status: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ location: 1 });
itemSchema.index({ reportedBy: 1 });

module.exports = mongoose.model('Item', itemSchema);