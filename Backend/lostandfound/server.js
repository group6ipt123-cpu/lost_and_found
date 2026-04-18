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
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());

// GENERAL RATE LIMIT - applies to all routes
app.use('/api/', apiLimiter);

// ROUTES
app.use('/api/auth', authLimiter, authRoutes); // stricter limit on auth
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);

// SWAGGER
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Lost and Found API",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js", "./models/*.js"],
};

const swaggerSpec = swaggerJsDoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// TEST ROUTE
app.get('/', (req, res) => {
    res.send('Lost and Found API running');
});

// ERROR HANDLING (must be after all routes)
app.use(notFound);
app.use(errorHandler);

// DATABASE
connectDB();

// SERVER
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});