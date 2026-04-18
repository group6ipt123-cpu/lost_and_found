require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'user' },
    studentId: String,
    contactNumber: String
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);

const itemSchema = new mongoose.Schema({
    name: String,
    description: String,
    category: String,
    itemCategory: String,
    location: String,
    date: Date,
    status: { type: String, default: 'pending' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const Item = mongoose.model('Item', itemSchema);

const seed = async () => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('Connected to database');

        // Create admin
        let admin = await User.findOne({ email: 'admin@example.com' });
        if (!admin) {
            admin = await User.create({
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'admin123',
                contactNumber: '0987654321',
                role: 'admin'
            });
            console.log('✅ Admin created');
        }

        // Create regular user
        let user = await User.findOne({ email: 'user@example.com' });
        if (!user) {
            user = await User.create({
                name: 'John Student',
                email: 'user@example.com',
                password: '123456',
                studentId: 'STU001',
                contactNumber: '1234567890',
                role: 'user'
            });
            console.log('✅ User created');
        }

        // Create sample items
        await Item.deleteMany({});
        
        const items = [
            {
                name: 'Lost MacBook Pro',
                description: 'Silver MacBook Pro 14-inch. Left in the Science Building room 204.',
                category: 'lost',
                itemCategory: 'Electronics',
                location: 'Science Building',
                date: new Date(),
                reportedBy: user._id
            },
            {
                name: 'Found AirPods Case',
                description: 'White AirPods Pro case found in the Student Center.',
                category: 'found',
                itemCategory: 'Electronics',
                location: 'Student Center',
                date: new Date(),
                reportedBy: admin._id
            },
            {
                name: 'Lost Student ID',
                description: 'Student ID for Sarah Johnson. Lost somewhere on campus.',
                category: 'lost',
                itemCategory: 'ID Card',
                location: 'Quadrangle',
                date: new Date(),
                reportedBy: user._id
            },
            {
                name: 'Found Keys',
                description: 'Set of keys with a blue keychain found in Parking Lot A.',
                category: 'found',
                itemCategory: 'Keys',
                location: 'Parking Lot A',
                date: new Date(),
                reportedBy: user._id
            },
            {
                name: 'Lost Water Bottle',
                description: 'Hydro Flask - black color. Left in the Gymnasium.',
                category: 'lost',
                itemCategory: 'Water Bottle',
                location: 'Gymnasium',
                date: new Date(),
                reportedBy: admin._id
            }
        ];

        await Item.insertMany(items);
        console.log(`✅ Created ${items.length} sample items`);

        console.log('\n📋 Login Credentials:');
        console.log('Admin: admin@example.com / admin123');
        console.log('User:  user@example.com / 123456');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seed();