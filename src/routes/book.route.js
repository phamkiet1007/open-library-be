const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { isAdmin, isMember } = require('../middlewares/role.middleware');

const { create,
    getAll,
    getById,
    updateBook,
    deleteBook,
    addRating 
} = require('../controllers/book.controller');

//public routes
router.get('/', getAll);
router.get('/:bookId', getById)

//require login
router.post('/:bookId/rating', authenticate, addRating);

//routes only for admin
router.put('/:bookId', authenticate, isAdmin, updateBook);
router.delete('/:bookId', authenticate, isAdmin, deleteBook);
router.post('/', authenticate, isAdmin, create)

module.exports = router;
