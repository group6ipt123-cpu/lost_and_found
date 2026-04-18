const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Claim:
 *       type: object
 *       required:
 *         - item
 *         - claimedBy
 *         - message
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         item:
 *           type: string
 *           description: ID of the item being claimed
 *         claimedBy:
 *           type: string
 *           description: ID of the user submitting the claim
 *         message:
 *           type: string
 *           description: Student's proof or description of ownership
 *           example: This is my umbrella, it has my name written inside
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           description: Status of the claim
 *           default: pending
 *         adminNote:
 *           type: string
 *           description: Optional note from admin when approving or rejecting
 *           example: Verified by student ID
 *         createdAt:
 *           type: string
 *           format: date-time
 */

const claimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item reference is required'],
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Claimant reference is required'],
    },
    message: {
      type: String,
      required: [true, 'Please provide a message describing your ownership'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNote: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent a user from claiming the same item twice
claimSchema.index({ item: 1, claimedBy: 1 }, { unique: true });

module.exports = mongoose.model('Claim', claimSchema);