const express = require('express');
const router = express.Router();
const {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
} = require('../controllers/itemController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Lost and Found item endpoints
 */

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Report a new lost or found item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - status
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 example: Black Umbrella
 *               description:
 *                 type: string
 *                 example: Black folding umbrella with a wooden handle
 *               category:
 *                 type: string
 *                 enum: [electronics, clothing, accessories, books, documents, others]
 *                 example: accessories
 *               status:
 *                 type: string
 *                 enum: [lost, found, claimed]
 *                 example: lost
 *               location:
 *                 type: string
 *                 example: Library 2nd Floor
 *               image:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *     responses:
 *       201:
 *         description: Item reported successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', protect, createItem);

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Get all items (with optional filters)
 *     tags: [Items]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [lost, found, claimed]
 *         description: Filter by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [electronics, clothing, accessories, books, documents, others]
 *         description: Filter by category
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location (partial match)
 *     responses:
 *       200:
 *         description: List of items
 *       500:
 *         description: Server error
 */
router.get('/', getAllItems);

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Get a single item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item details
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getItemById);

/**
 * @swagger
 * /api/items/{id}:
 *   put:
 *     summary: Update an item (owner or admin only)
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [electronics, clothing, accessories, books, documents, others]
 *               status:
 *                 type: string
 *                 enum: [lost, found, claimed]
 *               location:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.put('/:id', protect, updateItem);

/**
 * @swagger
 * /api/items/{id}:
 *   delete:
 *     summary: Delete an item (admin only)
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       403:
 *         description: Admins only
 *       404:
 *         description: Item not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', protect, adminOnly, deleteItem);

module.exports = router;