const express = require('express');
const router = express.Router();


const authRoutes = require('./auth.route');
const bookRoutes = require('./book.route');
const cartRoutes = require('./cart.route');
const userRoutes = require('./user.route');


router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/cart', cartRoutes);
router.use('/user', userRoutes);


module.exports = router;
