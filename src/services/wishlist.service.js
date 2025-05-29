const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getVietnamTime } = require("../utils/date.utils");

const addtoWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId } = req.body;
    if (!prisma.wishlist) {
      console.error("Wishlist model not available in Prisma client");
      return res.status(500).json({ error: "Database configuration error" });
    }

    const exists = await prisma.wishlist.findUnique({
      where: {
        userId_bookId: {
          userId: parseInt(userId),
          bookId: parseInt(bookId),
        },
      },
    });

    if (exists) {
      res.status(400).json({ message: "Book is already in wishlist" });
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: parseInt(userId),
        bookId: parseInt(bookId),
        createdAt: getVietnamTime(),
      },
    });

    res.status(201).json({ message: "Book added to wishlist", wishlistItem });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId } = req.body;

    const deleted = await prisma.wishlist.delete({
      where: {
        userId_bookId: {
          userId: parseInt(userId),
          bookId: parseInt(bookId),
        },
      },
    });

    res.status(201).json({ message: "Book removed from wishlist", deleted });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Book is not in wishlist" });
    }

    res.status(400).json({ error: "Failed to remove book from wishlist" });
    console.error("Error removing from wishlist:", error);
  }
};

const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;

    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId: parseInt(userId) },
      include: { book: true }, // Include book details
    });

    res.status(200).json(wishlistItems);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const isInWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId } = req.body;

    const exists = await prisma.wishlist.findUnique({
      where: {
        userId_bookId: {
          userId: parseInt(userId),
          bookId: parseInt(bookId),
        },
      },
    });
    return res.json({ isInWishlist: !!exists }); // Return true if exists, false otherwise
  } catch (error) {
    console.error("Error checking wishlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  addtoWishlist,
  removeFromWishlist,
  getUserWishlist,
  isInWishlist,
};
