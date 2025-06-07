const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { isAdmin, isMember } = require('../middlewares/role.middleware');

const { 
    createOrderFromCart,
    getOrdersByUser,
    buyNow,
    getAllOrders
} = require('../services/order.service');

router.post('/buy-now', authenticate, buyNow); //
router.post('/place-order', authenticate, createOrderFromCart); //
router.get('/get-my-orders', authenticate, getOrdersByUser); //

/*Admin route */
router.get('/get-all-orders', authenticate, isAdmin, getAllOrders); // 
/*Admin route */



module.exports = router;