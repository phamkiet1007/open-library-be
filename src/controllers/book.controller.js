const bookService = require('../services/book.service');

const create = async (req, res, next) => {
  try {
    const book = await bookService.createBook(req.body);
    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const {  page, limit, sortField, sortOrder, ...filters } = req.query;
    const data = await bookService.getBooks(filters, page, limit, sortField, sortOrder);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
    const { bookId } = req.params;

    try {
        const book = await bookService.getBookById(bookId);
        if (!book) {
            return next(createError(NOT_FOUND, 'Book not found'));
        }
        return res.status(201).json(book);

    } catch (error) {
      next(error);
    }
};

const updateBook = async (req, res, next) => {
    const { bookId } = req.params; 
    const bookData = req.body; 

    try {
        const updatedBook = await updateBook(bookId, bookData);
        return res.status(200).json({
            status: 'success',
            data: updatedBook,
        });
    } catch (error) {
        next(error); // Nếu có lỗi, chuyển tới middleware xử lý lỗi
    }
};


const deleteBook = async (req, res, next) => {
    const { bookId } = req.params; 

    try {
        const deletedBook = await deleteBook(bookId);
        return res.status(200).json({
            status: 'success',
            message: 'Book deleted successfully',
            data: deletedBook,
        });
    } catch (error) {
        next(error); //if is not error, pass to middleware to handle error
    }
};


const addRating = async (req, res, next) => {
    const { bookId } = req.params; 
    const { userId, rating, review } = req.body; 

    try {
        const ratingResponse = await addRating(bookId, userId, rating, review);
        return res.status(200).json({
            status: 'success',
            data: ratingResponse,
        });
    } catch (error) {
        next(error); 
    }
};

module.exports = { 
    create,
    getAll,
    getById,
    updateBook,
    deleteBook,
    addRating
};
