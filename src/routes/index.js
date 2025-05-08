const express = require('express');
const router = express.Router();

const uploadRoute = require('./upload.route');

const authRoutes = require('./auth.route');
const bookRoutes = require('./book.route');
const cartRoutes = require('./cart.route');

router.use('/upload-book', uploadRoute);

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/cart', cartRoutes);


module.exports = router;
