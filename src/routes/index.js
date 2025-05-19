const express = require('express');
const router = express.Router();


const authRoutes = require('./auth.route');
const bookRoutes = require('./book.route');
const ttsRoutes = require('./tts.route');
const cartRoutes = require('./cart.route');
const orderRoutes = require('./order.route');
const paymentRoutes = require('./payment.route');

const userRoutes = require('./user.route');


router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/text-to-speech', ttsRoutes);

router.use('/cart', cartRoutes);
router.use('/order', orderRoutes);
router.use('/payment', paymentRoutes);

router.use('/user', userRoutes);



module.exports = router;
