const router = require('express').Router();
const { register, login, verifyEmail, resendVerificationEmail} = require('../services/auth.service');

//define routes
router.post('/register', register); //
router.post('/login', login); //
router.post('/verify', verifyEmail); //
router.post('/resend-verification', resendVerificationEmail); //


module.exports = router;