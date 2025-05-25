const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getVietnamTime } = require('../utils/date.utils');

const addtoWishlist = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {bookId} = req.body;

        const exists = await prisma.wishlist.findUnique({
            where: {
                userId_bookId: {
                    userId: parseInt(userId),
                    bookId: parseInt(bookId),
                },
            },
        });
    
        if (exists) {
            res.status(400).json({ message: 'Book is already in wishlist'});
        }

        const wishlistItem = await prisma.wishlist.create({
            data: {
              userId,
              bookId,
              createdAt: getVietnamTime(),
            },
        });

        res.status(201).json({ message: 'Book added to wishlist', wishlistItem });
        
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


module.exports = {
    addtoWishlist,
};



