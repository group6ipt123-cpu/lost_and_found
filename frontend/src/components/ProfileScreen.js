app.put('/api/users/profile', async (req, res) => {
    try {
        const user = getUserFromToken(req);
        if (!user) {
            return res.json({ success: false, message: 'Unauthorized' });
        }

        const { name, studentId, contactNumber, currentPassword, newPassword } = req.body;

        const dbUser = await mongoose.connection.db.collection('users')
            .findOne({ _id: new ObjectId(user.id) });

        if (!dbUser) {
            return res.json({ success: false, message: 'User not found' });
        }

        // If changing password
        if (newPassword) {
            if (dbUser.password !== currentPassword) {
                return res.json({ success: false, message: 'Current password is incorrect' });
            }

            await mongoose.connection.db.collection('users').updateOne(
                { _id: new ObjectId(user.id) },
                {
                    $set: {
                        name,
                        studentId,
                        contactNumber,
                        password: newPassword
                    }
                }
            );
        } else {
            await mongoose.connection.db.collection('users').updateOne(
                { _id: new ObjectId(user.id) },
                {
                    $set: {
                        name,
                        studentId,
                        contactNumber
                    }
                }
            );
        }

        const updatedUser = await mongoose.connection.db.collection('users')
            .findOne(
                { _id: new ObjectId(user.id) },
                { projection: { password: 0 } }
            );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});