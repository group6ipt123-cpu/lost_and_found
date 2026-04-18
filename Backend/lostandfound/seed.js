require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: { type: String, default: 'user' },
    studentId: String,
    contactNumber: String,
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log(' Database connected');

        await User.deleteMany({ email: { $in: ['admin@example.com', 'user@example.com'] } });

        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'admin123',
            contactNumber: '0987654321',
            role: 'admin'
        });

        console.log('✅ Admin created:', admin.email);

        const user = await User.create({
            name: 'Test User',
            email: 'user@example.com',
            password: '123456',
            studentId: 'STU001',
            contactNumber: '1234567890',
            role: 'user'
        });

        console.log('✅ User created:', user.email);
        console.log('\n📋 LOGIN CREDENTIALS:');
        console.log('Admin: admin@example.com / admin123');
        console.log('User:  user@example.com / 123456');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

seedDatabase();