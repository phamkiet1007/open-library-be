const isAdmin = (req, res, next) => {
    // authenticate middleware must run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'You are not logged in.'
      });
    }
    
    //check role
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Do not have permission for this action!'
      });
    }
    
    next();
  };
  
const isMember = (req, res, next) => {
    // authenticate middleware must run first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'You are not logged in.'
      });
    }
    
    //both MEMBER and ADMIN have permission
    if (req.user.role !== 'MEMBER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Do not have permission for this action!'
      });
    }
    
    next();
  };
  
  module.exports = {
    isAdmin,
    isMember
  };