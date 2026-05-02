const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json({ success: false, message: 'Authentication required' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        next();
    } catch (err) {
        res.json({ success: false, message: 'Invalid token' });
    }
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Create a new user account. All new accounts are created with 'user' role.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - studentId
 *               - contactNumber
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Juan Dela Cruz"
 *                 description: Full name of the user
 *               email:
 *                 type: string
 *                 example: "juan@neu.edu.ph"
 *                 description: Valid email address
 *               password:
 *                 type: string
 *                 example: "password123"
 *                 description: Password (minimum 6 characters)
 *               studentId:
 *                 type: string
 *                 example: "22-12975-964"
 *                 description: Student ID in format XX-XXXXX-XXX
 *               contactNumber:
 *                 type: string
 *                 example: "09123456789"
 *                 description: Philippine mobile number
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Registration successful"
 *       400:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User already exists"
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, studentId, contactNumber } = req.body;
        const existing = await mongoose.connection.db.collection('users').findOne({ email: email.toLowerCase() });
        if (existing) return res.json({ success: false, message: 'User already exists' });
        await mongoose.connection.db.collection('users').insertOne({ name, email: email.toLowerCase(), password, studentId, contactNumber, role: 'user', createdAt: new Date() });
        res.json({ success: true, message: 'Registration successful' });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     description: Authenticate with email and password to receive a JWT token. The token is valid for 7 days.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@findera.com"
 *                 description: Registered email address
 *               password:
 *                 type: string
 *                 example: "Admin@123"
 *                 description: Account password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                   example: "eyJhbGciOiJIUzI1NiIs..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     studentId:
 *                       type: string
 *                     contactNumber:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await mongoose.connection.db.collection('users').findOne({ email: email.toLowerCase(), password });
        if (!user) return res.json({ success: false, message: 'Invalid credentials' });
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, studentId: user.studentId, contactNumber: user.contactNumber } });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     description: Returns the currently authenticated user's profile information. Requires a valid JWT token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     studentId:
 *                       type: string
 *                     contactNumber:
 *                       type: string
 *       401:
 *         description: Not authenticated or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Authentication required"
 */
router.get('/me', auth, async (req, res) => {
    try {
        const user = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(req.user.id) }, { projection: { password: 0 } });
        res.json({ success: true, data: user });
    } catch (err) { res.json({ success: false, message: err.message }); }
});

module.exports = router;