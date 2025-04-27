const authService = require('../services/auth.service');

const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.json({ ok: true, data: result });
    } catch (error) {
        next(error);
    }
};


const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        res.json({ ok: true, data: result });
    } catch (error) {
        next(error);
    }
};


const verifyEmail = async (req, res) => {
    try {
      const { token, email } = req.body;
      const result = await authService.verifyEmail(token, email);
      res.status(200).json(result);
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message });
    }
  };
  
  const resendVerification = async (req, res) => {
    try {
      const { email } = req.body;
      const result = await authService.resendVerificationEmail(email);
      res.status(200).json(result);
    } catch (error) {
      res.status(error.status || 500).json({ message: error.message });
    }
  };
  

module.exports = { 
    register, 
    login, 
    verifyEmail, 
    resendVerification 
};
