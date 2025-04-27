const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const {
    createError,
    CONFLICT,
    BAD_REQUEST,
    UNAUTHORIZED,
    NOT_FOUND,
    GENERAL_ERROR,
} = require('../helpers/error.helper');

//Pagination helper
const getPagination = (page, limit) => {
    const take = limit ? +limit : 10;
    const skip = page ? (page - 1) * take : 0;
    return { skip, take };
};

//Create book
const createBook = async (bookData) => {
    try {
        return await prisma.book.create({ data: bookData });
    } catch (error) {
        throw createError(GENERAL_ERROR, 'Error creating book');
    }
};

//Get all books
const getBooks = async (filters = {}, page = 1, limit = 10, sortField = 'created_at', sortOrder = 'desc') => {
    const { skip, take } = getPagination(page, limit);

    const where = {};

    if (filters.title) {
        where.title = { contains: filters.title, mode: 'insensitive' };
    }

    if (filters.author) {
        where.author = { contains: filters.author, mode: 'insensitive' };
    }

    if (filters.categories) {
        where.categories = {
            some: {
                name: { in: filters.categories }
            }
        };
    }

    if (filters.minPrice || filters.maxPrice) {
        where.price = {};
        if (filters.minPrice) where.price.gte = parseFloat(filters.minPrice);
        if (filters.maxPrice) where.price.lte = parseFloat(filters.maxPrice);
    }

    if (filters.isAvailableOnline !== undefined) {
        where.isAvailableOnline = filters.isAvailableOnline;
    }

    if (filters.search) {
        where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { author: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } }
        ];
    }

    const orderBy = {};
    orderBy[sortField] = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    try {
        const [books, totalCount] = await Promise.all([
            prisma.book.findMany({
                where,
                include: {
                    categories: true,
                    ratings: {
                        select: { rating: true }
                    }
                },
                skip,
                take,
                orderBy
            }),
            prisma.book.count({ where })
        ]);

        return {
            books,
            pagination: {
                total: totalCount,
                page: +page,
                limit: +limit,
                totalPages: Math.ceil(totalCount / limit),
            }
        };
    } catch (error) {
        throw createError(GENERAL_ERROR, 'Error fetching books');
    }
};

//Find book by ID
const getBookById = async (bookId) => {
    try {
        const book = await prisma.book.findUnique({
            where: { bookId: parseInt(bookId) },
            include: {
                categories: true,
                ratings: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                username: true
                            }
                        }
                    }
                }
            }
        });

        if (!book) {
            throw createError(NOT_FOUND, 'Book not found');
        }

        return book;
    } catch (error) {
        throw error;
    }
};

//Update book
const updateBook = async (bookId, bookData) => {
    try {
        const updatedBook = await prisma.book.update({
            where: { bookId: parseInt(bookId) },
            data: bookData
        });

        if (!updatedBook) {
            throw createError(NOT_FOUND, 'Book not found');
        }

        return updatedBook;
    } catch (error) {
        throw createError(GENERAL_ERROR, 'Error updating book');
    }
};

//Delete book
const deleteBook = async (bookId) => {
    try {
        const deletedBook = await prisma.book.delete({
            where: { bookId: parseInt(bookId) }
        });

        if (!deletedBook) {
            throw createError(NOT_FOUND, 'Book not found');
        }

        return deletedBook;
    } catch (error) {
        throw createError(GENERAL_ERROR, 'Error deleting book');
    }
};

//Add rating
const addRating = async (bookId, userId, rating, review) => {
    try {
        const existingRating = await prisma.rating.findFirst({
            where: {
                bookId: parseInt(bookId),
                userId: parseInt(userId)
            }
        });

        if (existingRating) {
            return await prisma.rating.update({
                where: { ratingId: existingRating.ratingId },
                data: { rating, review }
            });
        } else {
            return await prisma.rating.create({
                data: {
                    book: { connect: { bookId: parseInt(bookId) } },
                    user: { connect: { userId: parseInt(userId) } },
                    rating,
                    review
                }
            });
        }
    } catch (error) {
        throw createError(GENERAL_ERROR, 'Error adding rating');
    }
};

module.exports = {
    createBook,
    getBooks,
    getBookById,
    updateBook,
    deleteBook,
    addRating
};
