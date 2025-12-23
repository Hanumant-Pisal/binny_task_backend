
const User = require("../models/User.models")

exports.getUserProfile = async(req, res) => {
    try {
        const userdata = await User.findById(req.user.id).select('-passwordHash')

        if(!userdata){
            return res.status(404).json({message:"User not found"})
        }

        return res.status(200).json({
            success:true,
            data:userdata
        })
        
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({message:"Server error"})
    }
}

exports.updateUserProfile = async (req, res) => {
    const { username, email } = req.body;
    
    // Input validation
    if (username && (typeof username !== 'string' || username.trim().length < 3)) {
        return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }
    
    if (email && (typeof email !== 'string' || !email.includes('@'))) {
        return res.status(400).json({ message: 'Valid email is required' });
    }

    try {
        const updateData = {};
        if (username) updateData.username = username.trim();
        if (email) updateData.email = email.trim().toLowerCase();
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        ).select("-passwordHash");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            data: updatedUser
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(409).json({ message: `${field} already exists` });
        }
        return res.status(500).json({ message: "Server error" });
    }
};

