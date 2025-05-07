const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { isAdmin, isMember } = require('../middlewares/role.middleware');

const { 
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} = require('../services/cart.service');


router.get('/', authenticate, getCart); //
router.post('/add-item', authenticate, addToCart); //
router.patch('/update-item', authenticate, updateCartItem); //
router.delete('/remove-item', authenticate, removeFromCart); 
router.delete('/clear-all', authenticate, clearCart); 


module.exports = router;