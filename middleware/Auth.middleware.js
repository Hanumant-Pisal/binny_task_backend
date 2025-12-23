const jwt = require('jsonwebtoken');

const authCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const authMiddleware = (requiredRole) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                message: 'Authorization header is required' 
            });
        }
        
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: 'Authorization header must start with "Bearer "' 
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                message: 'Token is required' 
            });
        }
        
        if (token.length < 10) {
            return res.status(401).json({ 
                message: 'Invalid token format' 
            });
        }

        const cacheKey = `${token}_${requiredRole || 'none'}`;
        const cached = authCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            req.user = cached.user;
            return next();
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (!decoded.id || !decoded.role) {
                return res.status(401).json({ 
                    message: 'Invalid token payload' 
                });
            }
            
            if (requiredRole && decoded.role !== requiredRole) {
                return res.status(403).json({ 
                    message: `Access denied. Required role: ${requiredRole}` 
                });
            }

            req.user = decoded;
            
            authCache.set(cacheKey, {
                user: decoded,
                timestamp: Date.now()
            });
            
            if (authCache.size > 1000) {
                const oldestKey = authCache.keys().next().value;
                authCache.delete(oldestKey);
            }

            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    message: 'Invalid token' 
                });
            }
            
            if (error.name === 'TokenExpiredError') {
                authCache.delete(cacheKey);
                return res.status(401).json({ 
                    message: 'Token expired' 
                });
            }
            
            console.error('Authentication error:', error);
            return res.status(500).json({ 
                message: 'Authentication error' 
            });
        }
    };
};

module.exports = authMiddleware;
