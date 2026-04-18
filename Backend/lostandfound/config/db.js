const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DB_URL);
        console.log(`Database connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Database connection error: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;