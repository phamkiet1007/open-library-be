const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.route');
const bookRoutes = require('./book.route');

router.use('/auth', authRoutes);
router.use('/books', bookRoutes);


module.exports = router;
