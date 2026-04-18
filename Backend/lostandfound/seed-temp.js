const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// TEMPORARY - Get this from your config/db.js
const MONGO_URI = 'mongodb+srv://your_username:your_password@ac-hcftbs1-shard-00-00.l0w2uv1.mongodb.net/lostandfound?retryWrites=true&w=majority';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    studentId: { type: String, default: null },
    contactNumber: { type: String, required: true },
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
        console.log('Connecting to database...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected');

        // Create admin
        const admin = await User.findOneAndUpdate(
            { email: 'admin@example.com' },
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'admin123',
                contactNumber: '0987654321',
                role: 'admin'
            },
            { upsert: true, new: true }
        );

        console.log('\n✅ Admin ready:');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');
        console.log('Role:', admin.role);

        // Create user
        const user = await User.findOneAndUpdate(
            { email: 'user@example.com' },
            {
                name: 'Test User',
                email: 'user@example.com',
                password: '123456',
                studentId: 'STU001',
                contactNumber: '1234567890',
                role: 'user'
            },
            { upsert: true, new: true }
        );

        console.log('\n✅ User ready:');
        console.log('Email: user@example.com');
        console.log('Password: 123456');
        console.log('Role:', user.role);

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedDatabase();