require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
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

// Item Schema
const itemSchema = new mongoose.Schema({
    name: String,
    description: String,
    category: String,
    itemCategory: String,
    location: String,
    date: Date,
    image: String,
    status: { type: String, default: 'pending' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', itemSchema);

const seedAll = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('Database connected');

        // Delete existing data
        await User.deleteMany({ email: { $in: ['admin@example.com', 'user@example.com'] } });
        await Item.deleteMany({});

        // Create admin
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'admin123',
            contactNumber: '0987654321',
            role: 'admin'
        });
        console.log('Admin created:', admin.email);

        // Create regular user
        const user = await User.create({
            name: 'John Student',
            email: 'user@example.com',
            password: '123456',
            studentId: 'STU001',
            contactNumber: '1234567890',
            role: 'user'
        });
        console.log('User created:', user.email);

        // Create sample items
        const items = [
            {
                name: 'Lost MacBook Pro',
                description: 'Silver MacBook Pro 14-inch. Left in the Science Building room 204.',
                category: 'lost',
                itemCategory: 'Electronics',
                location: 'Science Building',
                date: new Date(),
                status: 'pending',
                reportedBy: user._id
            },
            {
                name: 'Found AirPods Case',
                description: 'White AirPods Pro case found in the Student Center.',
                category: 'found',
                itemCategory: 'Electronics',
                location: 'Student Center',
                date: new Date(),
                status: 'pending',
                reportedBy: admin._id
            },
            {
                name: 'Lost Student ID',
                description: 'Student ID for Sarah Johnson. Lost somewhere on campus.',
                category: 'lost',
                itemCategory: 'ID Card',
                location: 'Quadrangle',
                date: new Date(),
                status: 'pending',
                reportedBy: user._id
            },
            {
                name: 'Found Keys',
                description: 'Set of keys with a blue keychain found in Parking Lot A.',
                category: 'found',
                itemCategory: 'Keys',
                location: 'Parking Lot A',
                date: new Date(),
                status: 'pending',
                reportedBy: user._id
            },
            {
                name: 'Lost Water Bottle',
                description: 'Hydro Flask - black color. Left in the Gymnasium.',
                category: 'lost',
                itemCategory: 'Water Bottle',
                location: 'Gymnasium',
                date: new Date(),
                status: 'pending',
                reportedBy: admin._id
            },
            {
                name: 'Found Umbrella',
                description: 'Blue umbrella found near the Cafeteria entrance.',
                category: 'found',
                itemCategory: 'Umbrella',
                location: 'Cafeteria',
                date: new Date(),
                status: 'pending',
                reportedBy: user._id
            }
        ];

        const createdItems = await Item.insertMany(items);
        console.log(`Created ${createdItems.length} items`);

        console.log('\nLOGIN CREDENTIALS:');
        console.log('Admin: admin@example.com / admin123');
        console.log('User:  user@example.com / 123456');

        await mongoose.connection.close();
        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

seedAll();