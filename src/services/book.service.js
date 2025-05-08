const { getVietnamTime } = require('../utils/date.utils');

const multer = require('multer')
const supabase = require('../configs/supabaseClient')

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

// Upload files to Supabase Storage
const uploadFile = async (file, folderName) => {
  const fileName = `${getVietnamTime()}-${file.originalname}`;
  const { data, error } = await supabase.storage
    .from(folderName)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) throw new Error(error.message);

  const { data: publicUrlData } = supabase.storage
    .from(folderName)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]);


// Create Book
const createBook = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ error: 'No files have been uploaded' });
    }

    console.log('BODY:', req.body);
    console.log('FILES:', req.files);

    let pdfUrl = null;
    let coverImageUrl = null;

    //file PDF
    if (req.files.file && req.files.file[0]) {
      pdfUrl = await uploadFile(req.files.file[0], 'books-pdf');
    } else {
      return res.status(400).json({ error: 'Missing bookPDF' });
    }

    //coverImg
    if (req.files.coverImage && req.files.coverImage[0]) {
      coverImageUrl = await uploadFile(req.files.coverImage[0], 'books-covers');
    } else {
      return res.status(400).json({ error: 'Missing coverImg' });
    }

    //make the body clean before saving
    const cleanedBody = {
      title: req.body.title?.trim().replace(/^"|"$/g, ''),
      author: req.body.author?.trim().replace(/^"|"$/g, ''),
      price: parseFloat(req.body.price),
      quantity_available: parseInt(req.body.quantity_available),
      description: req.body.description?.trim().replace(/^"|"$/g, ''),
      publisher: req.body.publisher?.trim().replace(/^"|"$/g, ''),
      publishDate: new Date(req.body.publishDate?.trim().replace(/^"|"$/g, '')),
      isbn: req.body.isbn?.trim().replace(/^"|"$/g, ''),
      format: req.body.format?.trim().replace(/^"|"$/g, ''),
      previewPages: parseInt(req.body.previewPages),
      isAvailableOnline: req.body.isAvailableOnline?.toLowerCase() === "true",
      coverImage: coverImageUrl,  
      filePath: pdfUrl,           
    };

    //Parse list categoryId
    const categoryIds = req.body.categories
      ?.trim()
      .replace(/^"|"$/g, '')
      .split(',')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id));

    //check for required field
    if (!cleanedBody.title) {
      return res.status(400).json({ error: 'Book-title missing' });
    }

    //create new book and save
    const newBook = await book.create({
      data: {
        ...cleanedBody,
        created_at: getVietnamTime(),
        updated_at: getVietnamTime(),
        categories: {
          create: categoryIds.map(id => ({
            category: { connect: { categoryId: id } }
          }))
        },
      },
      include: {
        categories: true
      }
    });
    
    res.status(201).json(newBook);
  } catch (error) {
    console.error('error details:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Violation of uniqueness constraint', 
        field: error.meta?.target 
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'foreign key constraint violation', 
        field: error.meta?.field_name 
      });
    }
    
    res.status(500).json({ 
      error: 'Can not create !', 
      message: error.message
    });
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
      const { title, names, author, publisher } = req.query;  //names of categories
  
      const filters = {};
  
      if (title) {
        filters.title = {
          contains: title,
          mode: 'insensitive',
        };
      }

      if (author) {
        filters.author = {
          contains: author,
          mode: 'insensitive',
        };
      }
  
      if (publisher) {
        filters.publisher = {
          contains: publisher,
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
      
      console.log(JSON.stringify(filters, null, 2)); //debug

      const books = await book.findMany({
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
      })); //format for pretty-view categories
  
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

const getCategories = async (req,res) => {
  try {
      const result = await category.findMany();
      res.status(200).json(result);
  } catch (error) {
      console.error(error);
      res.status(500).json(error);
  }
}

module.exports = {
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
};
