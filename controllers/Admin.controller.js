const User = require('../models/User.models');

const Movie = require('../models/Movie.models');


exports.getAdminStats = async (req, res) => {
    try {
        const [totalUsers, totalMovies] = await Promise.all([
            User.countDocuments(),
            Movie.countDocuments()
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalMovies,
                totalReviews: 0
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch admin stats' 
        });
    }
};


exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        if (isNaN(page) || page < 1) {
            return res.status(400).json({ message: 'Invalid page number' });
        }
        
        if (isNaN(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({ message: 'Invalid limit (must be 1-100)' });
        }
        
        const skip = (page - 1) * limit;

        const [users, totalUsers] = await Promise.all([
            User.find()
                .select('-passwordHash')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments()
        ]);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalUsers / limit),
                    totalUsers,
                    limit
                }
            }
        });
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch users' 
        });
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Input validation
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ message: 'Valid user ID is required' });
        }

        // Prevent deleting admin users
        const userToDelete = await User.findById(userId);
        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToDelete.role === 'admin') {
            return res.status(403).json({ message: 'Cannot delete admin users' });
        }

        if (userToDelete._id.toString() === req.user.id) {
            return res.status(403).json({ message: 'Cannot delete your own account' });
        }
        
        await User.findByIdAndDelete(userId);

        res.json({ 
            success: true,
            message: 'User deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete user' 
        });
    }
};


exports.deleteMovie = async (req, res) => {
    try {
        const { movieId } = req.params;
        
        // Input validation
        if (!movieId || typeof movieId !== 'string') {
            return res.status(400).json({ message: 'Valid movie ID is required' });
        }
        
        const movie = await Movie.findByIdAndDelete(movieId);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        res.json({ 
            success: true,
            message: 'Movie deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting movie:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to delete movie' 
        });
    }
};