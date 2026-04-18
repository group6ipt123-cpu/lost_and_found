const express = require('express');
const router = express.Router();
const {
  createClaim,
  getAllClaims,
  getClaimsByItem,
  approveClaim,
  rejectClaim,
} = require('../controllers/claimController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Claims
 *   description: Claim request endpoints
 */

/**
 * @swagger
 * /api/claims:
 *   post:
 *     summary: Submit a claim on a found item
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - message
 *             properties:
 *               itemId:
 *                 type: string
 *                 description: ID of the found item to claim
 *                 example: 664f1a2b3c4d5e6f7a8b9c0d
 *               message:
 *                 type: string
 *                 description: Proof or description of ownership
 *                 example: This is my umbrella, it has my name written inside the handle
 *     responses:
 *       201:
 *         description: Claim submitted successfully
 *       400:
 *         description: Validation error or duplicate claim
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.post('/', protect, createClaim);

/**
 * @swagger
 * /api/claims:
 *   get:
 *     summary: Get all claims (admin sees all, student sees own)
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of claims
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', protect, getAllClaims);

/**
 * @swagger
 * /api/claims/item/{itemId}:
 *   get:
 *     summary: Get all claims for a specific item (admin only)
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: List of claims for the item
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admins only
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.get('/item/:itemId', protect, adminOnly, getClaimsByItem);

/**
 * @swagger
 * /api/claims/{id}/approve:
 *   put:
 *     summary: Approve a claim and auto-mark item as claimed (admin only)
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Claim ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminNote:
 *                 type: string
 *                 example: Verified by student ID
 *     responses:
 *       200:
 *         description: Claim approved, item marked as claimed
 *       400:
 *         description: Claim already processed or item already claimed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admins only
 *       404:
 *         description: Claim not found
 *       500:
 *         description: Server error
 */
router.put('/:id/approve', protect, adminOnly, approveClaim);

/**
 * @swagger
 * /api/claims/{id}/reject:
 *   put:
 *     summary: Reject a claim (admin only)
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Claim ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminNote:
 *                 type: string
 *                 example: Could not verify ownership
 *     responses:
 *       200:
 *         description: Claim rejected
 *       400:
 *         description: Claim already processed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admins only
 *       404:
 *         description: Claim not found
 *       500:
 *         description: Server error
 */
router.put('/:id/reject', protect, adminOnly, rejectClaim);

module.exports = router;