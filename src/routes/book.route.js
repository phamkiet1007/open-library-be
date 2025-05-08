const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { isAdmin, isMember } = require('../middlewares/role.middleware');

const { 
    upload,
    createBook,
    getBooks,
    getBookById,
    searchBooks,
    updateBook,
    deleteBook,
    addRating,
    createCategory,
    getCategories
} = require('../services/book.service');

//public routes
router.get('/', getBooks); //
router.get('/categories', getCategories); //
router.get('/search', searchBooks); // let static routers stay before the dynamic ones
router.get('/:bookId', getBookById); //

//require user login
router.post('/:bookId/rating', authenticate, addRating); //

//routes only for admin
router.post('/create', authenticate, isAdmin, upload, createBook); //

router.post('/create-categories', authenticate, isAdmin, createCategory); //
router.patch('/update/:bookId', authenticate, isAdmin, updateBook); //
router.delete('/delete/:bookId', authenticate, isAdmin, deleteBook); //

module.exports = router;
