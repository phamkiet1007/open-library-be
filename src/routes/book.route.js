const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { isAdmin, isMember } = require('../middlewares/role.middleware');

const { 
    createBook,
    getBooks,
    getBookById,
    searchBooks,
    updateBook,
    deleteBook,
    addRating,
    createCategory
} = require('../services/book.service');

//public routes
router.get('/', getBooks); //
router.get('/search', searchBooks); // let static routers stay before the dynamic ones
router.get('/:bookId', getBookById); //

//require login
router.post('/:bookId/rating', authenticate, addRating); //

//routes only for admin
router.put('/:bookId', authenticate, isAdmin, updateBook); //
router.delete('/:bookId', authenticate, isAdmin, deleteBook); //
router.post('/', authenticate, isAdmin, createBook); //
router.post('/categories', authenticate, isAdmin, createCategory); //

module.exports = router;
