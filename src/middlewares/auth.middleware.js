const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    //take token from header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Can not find the token'
      });
    }

    //split and take token from header
    const token = authHeader.split(' ')[1];
    
    //verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    //check for exist user
    const user = await prisma.user.findUnique({
      where: { userId: decoded.userId }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Non-exist user'
      });
    }
    
    
    req.user = {
      userId: user.userId,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has been expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid Token'
    });
  }
};


//Middleware for accepting request without token (preview books)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      //do not have token => still continue
      return next();
    }
    
    //verify if has a token
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { userId: decoded.userId }
      });
      
      if (user) {
        req.user = {
          userId: user.userId,
          username: user.username,
          email: user.email,
          role: user.role
        };
      }
    } catch (error) {
        // Token authentication error, but still allows request to continue
        // no user information
    }
    
    next();

  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};