// Handles 404 - Route not found
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler - catches all errors passed via next(err)
const errorHandler = (err, req, res, next) => {
  // If status is still 200 (no specific status set), default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Hide internal details in production
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack }), // show stack trace in dev only
  });
};

module.exports = { notFound, errorHandler };