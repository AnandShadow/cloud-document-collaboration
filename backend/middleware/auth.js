const { auth } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const checkRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.role || 'viewer';
      
      if (!requiredRoles.includes(userRole)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: requiredRoles,
          current: userRole
        });
      }
      
      next();
    } catch (error) {
      console.error('Error checking role:', error);
      return res.status(500).json({ error: 'Error checking permissions' });
    }
  };
};

module.exports = { verifyToken, checkRole };
