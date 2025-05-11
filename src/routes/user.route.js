const router = require('express').Router();
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');


const {getUserInformation} = require('../services/user.service');

router.get("/account", authenticate, getUserInformation);

module.exports = router