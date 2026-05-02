const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FindEra - Lost and Found API Documentation',
            version: '1.0.0',
            description: `
FindEra Lost and Found Platform API

Features:
- User authentication and authorization (JWT)
- Post lost and found items
- Search and filter items
- Real-time chat messaging
- Push notifications
- Admin dashboard
- Image upload support
- Auto-expiration of items
- Status tracking

Authentication:
Most endpoints require a JWT token. Get your token by:
1. Registering a new user at /api/auth/register
2. Logging in at /api/auth/login
3. Click the "Authorize" button and enter: Bearer YOUR_TOKEN_HERE

Testing Accounts:
- Admin: admin@findera.com / Admin@123
- User: Register your own account
            `,
            contact: {
                name: 'FindEra Support',
                email: 'support@findera.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            { url: 'http://localhost:5000/api', description: 'Local Development' },
            { url: 'https://lostandfound-three-kohl.vercel.app/api', description: 'Production (Vercel)' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token from login'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', example: 'john@neu.edu.ph' },
                        role: { type: 'string', enum: ['user', 'admin'] },
                        studentId: { type: 'string', example: '22-12975-964' },
                        contactNumber: { type: 'string', example: '09123456789' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Item: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string', example: 'Lost Wallet' },
                        description: { type: 'string' },
                        category: { type: 'string', enum: ['lost', 'found'] },
                        itemCategory: { type: 'string', example: 'Wallet/Purse' },
                        location: { type: 'string', example: 'Main Library' },
                        date: { type: 'string', format: 'date' },
                        image: { type: 'string' },
                        status: { type: 'string', enum: ['pending', 'claimed', 'verified', 'ready_for_pickup', 'closed', 'expired'] },
                        userId: { type: 'string' },
                        userName: { type: 'string' },
                        daysRemaining: { type: 'integer', description: 'Days until auto-expiration' },
                        expiryDate: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Message: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        roomId: { type: 'string' },
                        senderId: { type: 'string' },
                        senderName: { type: 'string' },
                        message: { type: 'string' },
                        read: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Notification: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        userId: { type: 'string' },
                        type: { type: 'string', enum: ['new_message', 'potential_match', 'item_claimed'] },
                        title: { type: 'string' },
                        message: { type: 'string' },
                        isRead: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' }
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Authentication & registration' },
            { name: 'Items', description: 'Lost and found items' },
            { name: 'Claims', description: 'Item claiming process' },
            { name: 'Chat', description: 'Messaging system' },
            { name: 'Notifications', description: 'User notifications' },
            { name: 'Users', description: 'Profile management' },
            { name: 'Admin', description: 'Admin dashboard' }
        ]
    },
    apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;