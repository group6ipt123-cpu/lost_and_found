require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const claimRoutes = require('./routes/claimRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const connectDB = require('./config/db');
const notificationRoutes = require('./routes/notificationRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const PORT = process.env.PORT || 3000;

// MIDDLEWARE
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000'],
    credentials: true
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DATABASE
connectDB();

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/inquiries', inquiryRoutes);

// SWAGGER
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Lost and Found API",
            version: "1.0.0",
            description: "API for Lost and Found Application",
        },
        servers: [
            { url: "http://localhost:3000", description: "Development server" }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./routes/*.js", "./models/*.js"],
};

const swaggerSpec = swaggerJsDoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// TEST ROUTE
app.get('/', (req, res) => {
    res.send('Lost and Found API running');
});

// 404 HANDLER
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// ERROR HANDLER
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Server Error'
    });
});

// SERVER
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});