const { getVietnamTime } = require('../utils/date.utils');

const { PrismaClient } = require('@prisma/client');
const { book, rating, category, bookCategory } = new PrismaClient({
    log: ["query", "info", "warn", "error"]
});;

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
const createBook = async (req, res) => {
    try {
        const { categories, ...bookData } = req.body;

        const newBook = await book.create({
            data: {
                ...bookData,
                created_at: getVietnamTime(),
                updated_at: getVietnamTime(),
                categories: {
                    create: categories.map((categoryId) => ({
                        category: {
                            connect: { categoryId }
                        }
                    })),
                },
            },         
        });

        res.status(201).json(newBook);
    } catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
};

//Get all books
// const getBooks = async (req, res) => {
//     const {  page, limit, sortField, sortOrder, ...filters } = req.query;

//     const { skip, take } = getPagination(page, limit);

//     const where = {};

//     if (filters.title) {
//         where.title = { contains: filters.title, mode: 'insensitive' };
//     }

//     if (filters.author) {
//         where.author = { contains: filters.author, mode: 'insensitive' };
//     }

//     if (filters.categories) {
//         where.categories = {
//             some: {
//                 name: { in: filters.categories }
//             }
//         };
//     }

//     if (filters.minPrice || filters.maxPrice) {
//         where.price = {};
//         if (filters.minPrice) where.price.gte = parseFloat(filters.minPrice);
//         if (filters.maxPrice) where.price.lte = parseFloat(filters.maxPrice);
//     }

//     if (filters.isAvailableOnline !== undefined) {
//         where.isAvailableOnline = filters.isAvailableOnline;
//     }

//     if (filters.search) {
//         where.OR = [
//             { title: { contains: filters.search, mode: 'insensitive' } },
//             { author: { contains: filters.search, mode: 'insensitive' } },
//             { description: { contains: filters.search, mode: 'insensitive' } }
//         ];
//     }

//     const orderBy = {};
//     orderBy[sortField] = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

//     try {
//         const [books, totalCount] = await Promise.all([
//             book.findMany({
//                 where,
//                 include: {
//                     categories: true,
//                     ratings: {
//                         select: { rating: true }
//                     }
//                 },
//                 skip,
//                 take,
//                 orderBy
//             }),
//             book.count({ where })
//         ]);

//         return {
//             books,
//             pagination: {
//                 total: totalCount,
//                 page: +page,
//                 limit: +limit,
//                 totalPages: Math.ceil(totalCount / limit),
//             }
//         };
//     } catch (error) {
//         console.error(error);
//         res.status(500).json(error);
//     }
// };
const getBooks = async (req,res) => {
    try {
        const result = await book.findMany();
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
}

//Find book by ID
const getBookById = async (req, res) => {
    try {
        const { bookId } = req.params;

        const foundBook = await book.findUnique({
            where: { bookId: parseInt(bookId) },
            include: {
                categories: {
                    include: {
                        category: {     
                            select: {
                                name: true
                            }
                        }
                    }
                },
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

        if (!foundBook) {
            throw createError(NOT_FOUND, 'Book not found');
        }

        foundBook.categories = foundBook.categories.map(cat => cat.category.name);

        res.status(200).json(foundBook);
    } catch (error) {
        res.status(400).json(error);
    }
};

//search book by title and category
const searchBooks = async (req, res) => {
    try {
      const { title, names } = req.query;  //names of categories
  
      const filters = {};
  
      if (title) {
        filters.title = {
          contains: title,
          mode: 'insensitive',
        };
      }
  
      if (names && Array.isArray(names)) {
        filters.categories = {
          some: {
            category: {
              name: {
                in: names.map(name => name.toLowerCase()),  //"in" to find many values
                mode: 'insensitive',
              }
            }
          }
        };
      }
      
      console.log(JSON.stringify(filters, null, 2));

      const books = await prisma.book.findMany({
        where: filters,
        include: {
          categories: {
            include: {
              category: {
                select: { name: true },
              },
            },
          },
          ratings: {
            include: {
              user: {
                select: {
                  userId: true,
                  username: true,
                },
              },
            },
          },
        },
      });
  
      const transformedBooks = books.map((b) => ({
        ...b,
        categories: b.categories.map((cat) => cat.category.name),
      }));
  
      res.status(200).json(transformedBooks);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
};

  
  


//Update book
const updateBook = async (req, res) => {
    try {
      const { bookId } = req.params; 
      const bookData = req.body; 
      const { categories, ...bookFields } = bookData;
  
      //update book
      const updatedBook = await book.update({
        where: { bookId: parseInt(bookId) },
        data: {
            ...bookFields, 
            updated_at: getVietnamTime(),
        }
      });
  
      if (!updatedBook) {
        throw createError(NOT_FOUND, 'Book not found');
      }
  
      //if there is a update for categories
      if (categories && Array.isArray(categories)) {
        //delete old ones
        await bookCategory.deleteMany({
          where: { bookId: parseInt(bookId) }
        });
  
        //create new categories
        const newCategories = categories.map(categoryId => ({
          bookId: parseInt(bookId),
          categoryId: parseInt(categoryId)
        }));
  
        await bookCategory.createMany({
          data: newCategories
        });
      }
  
      return res.status(200).json({ 
        message: 'Book updated successfully',
        updatedBook 
      });
  
    } catch (error) {
      console.error(error);
      res.status(400).json(error);
    }
};
  

//Delete book
const deleteBook = async (req, res) => {
    try {
        const { bookId } = req.params; 

        console.log("Start deleting book:", bookId);

        const deletedBook = await book.delete({
            where: { bookId: parseInt(bookId) }
        });

        if (!deletedBook) {
            throw createError(NOT_FOUND, 'Book not found');
        }

        return res.status(200).json(deletedBook);

    } catch (error) {
        console.error(error);
        res.status(400).json(error);
    }
};

//Add rating
const addRating = async (req, res) => {
    try {
      const { bookId } = req.params; 
      const { userId, newRating, review } = req.body;
  
      const parsedBookId = parseInt(bookId);
      const parsedUserId = parseInt(userId);
  
      const existingRating = await rating.findFirst({
        where: {
          bookId: parsedBookId,
          userId: parsedUserId
        }
      });
  
      let result;
      if (existingRating) {
        result = await rating.update({
          where: { ratingId: existingRating.ratingId },
          data: { 
            newRating, 
            review,
            updated_at: getVietnamTime(),  
        }
        });
      } else {
        result = await rating.create({
          data: {
            book: { connect: { bookId: parsedBookId } },
            user: { connect: { userId: parsedUserId } },
            rating,
            review,
            created_at: getVietnamTime(),
            updated_at: getVietnamTime(),
          }
        });
      }
  
      res.status(200).json(result);
    } catch (error) {
      console.error("Error adding rating:", error);
      res.status(400).json({ error: error.message });
    }
};
  

//Create categories => Categories table
const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        const newCategory = await category.create( {data: { name }} );
        res.status(201).json(newCategory);

    } catch (error) {
      console.error("Error adding rating:", error);
      res.status(400).json({ error: error.message });
    }
};


module.exports = {
    createBook,
    getBooks,
    getBookById,
    searchBooks,
    updateBook,
    deleteBook,
    addRating,
    createCategory, 
};
