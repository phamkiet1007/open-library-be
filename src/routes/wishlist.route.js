const router = require('express').Router();
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');


const {addtoWishlist} = require('../services/wishlist.service');

router.post("/adding", authenticate, addtoWishlist); //

module.exports = router