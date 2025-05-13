const express = require('express');
const router = express.Router();


const authRoutes = require('./auth.route');
const bookRoutes = require('./book.route');
const cartRoutes = require('./cart.route');
const orderRoutes = require('./order.route');
const userRoutes = require('./user.route');


router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/cart', cartRoutes);
router.use('/order', orderRoutes);
router.use('/user', userRoutes);



module.exports = router;
