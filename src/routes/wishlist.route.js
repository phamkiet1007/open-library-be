const router = require('express').Router();
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');


const {addtoWishlist, 
    removeFromWishlist, 
    getUserWishlist,
    isInWishlist
} = require('../services/wishlist.service');

router.get("/", authenticate, getUserWishlist); //
router.post("/adding", authenticate, addtoWishlist); //
router.delete("/removing", authenticate, removeFromWishlist); //
router.get("/true", optionalAuth, isInWishlist); // 


module.exports = router