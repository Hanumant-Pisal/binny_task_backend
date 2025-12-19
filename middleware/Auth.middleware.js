const jwt = require('jsonwebtoken');

const authMiddleware = (requiredRole) => {
    return (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token){
             return res.status(401).json({ message: 'token is required' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            if (requiredRole && req.user.role !== requiredRole) {
                return res.status(403).json({ message: 'you do not have permission' });
            }

            next();
        } catch (error) {
            res.status(401).json({ message: 'Invalid token' });
        }
    };
};

module.exports = authMiddleware;
