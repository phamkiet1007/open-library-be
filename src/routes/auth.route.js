const router = require('express').Router();
const { register, login, verifyEmail, resendVerification} = require('../controllers/auth.controller');

//define routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify', verifyEmail);
router.post('/resend-verification', resendVerification);


module.exports = router;