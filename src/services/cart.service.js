const { getVietnamTime } = require('../utils/date.utils');


const { PrismaClient } = require('@prisma/client');
const { cart, cartItem } = new PrismaClient({
    log: ["query", "info", "warn", "error"]
});;

const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    //retry if there are troubles with connection
    let retries = 3;
    let foundCart = null;
    
    while (retries > 0 && foundCart === null) {
      try {
        console.time("getCart Prisma query");
        
        foundCart = await cart.findUnique({
          where: { userId },
          select: {
            cartId: true,
            items: {
              select: {
                quantity: true,
                book: {
                  select: {
                    bookId: true,
                    title: true,
                    price: true,
                    coverImage: true
                  }
                }
              }
            }
          }
        });
        console.timeEnd("getCart Prisma query");
        break; //break the loop if query successfully
      } catch (queryError) {
        retries--;
        if (retries === 0) res.status(400).json(queryError) ; //no more retry
        
        console.warn(`Retry (still ${retries} times)...`);
        //wait a while before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (!foundCart) {
      return res.status(200).json({
        cartId: null,
        items: [],
        totalQuantity: 0,
        totalPrice: 0
      });
    }

    //compute totalQuantity & totalPrice
    const { items, totalQuantity, totalPrice } = foundCart.items.reduce(
      (acc, { book, quantity }) => {
        acc.items.push({
          bookId: book.bookId,
          title: book.title,
          price: book.price,
          coverImage: book.coverImage,
          quantity
        });
        acc.totalQuantity += quantity;
        acc.totalPrice += quantity * book.price;
        return acc;
      },
      { items: [], totalQuantity: 0, totalPrice: 0 }
    );

    //cache control to optimize performance
    res.setHeader('Cache-Control', 'private, max-age=10'); // Cache 10 mis from client-side
    
    res.status(200).json({
      cartId: foundCart.cartId,
      items,
      totalQuantity,
      totalPrice
    });

  } catch (error) {
    console.error("Error in getCart:", error);
    res.status(400).json(error);
  }
};

  

const addToCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bookId, quantity } = req.body;

        // Upsert Cart
        const foundCart = await cart.upsert({
            where: { userId },
            update: { updatedAt: getVietnamTime() },
            create: { userId, updatedAt: getVietnamTime() }
        });

        // Check if CartItem exists
        const existingItem = await cartItem.findUnique({
            where: {
                cartId_bookId: {
                    cartId: foundCart.cartId,
                    bookId: bookId
                }
            }
        });

        if (existingItem) {
            // Update quantity if exists
            await cartItem.update({
                where: {
                    cartId_bookId: {
                        cartId: foundCart.cartId,
                        bookId: bookId
                    }
                },
                data: {
                    quantity: existingItem.quantity + quantity
                }
            });
        } else {
            // Create new cart item
            await cartItem.create({
                data: {
                    cartId: foundCart.cartId,   // Use foreign key directly
                    bookId: bookId,             // Avoid `connect` to reduce extra query
                    quantity
                }
            });
        }

        return res.status(200).json({ success: true, message: 'Added to cart' });

    } catch (error) {
        console.error('Add to cart error:', error);
        return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
};

  

const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bookId, quantity } = req.body;

        const foundCart = await cart.findUnique({ where: { userId } });

        if (!foundCart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        await cartItem.update({
            where: {
                cartId_bookId: {
                    cartId: foundCart.cartId,
                    bookId
                }
            },
            data: { quantity }
        });

        return res.status(200).json({ success: true, message: 'Quantity updated' });
    } catch (error) {
        console.error("Error in updateCartItem:", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};


const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bookId } = req.body;

        const foundCart = await cart.findUnique({ where: { userId } });

        if (!foundCart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        await cartItem.delete({
            where: {
                cartId_bookId: {
                    cartId: foundCart.cartId,
                    bookId
                }
            }
        });

        //delete if there is no items in user's cart
        const itemCount = await cartItem.count({
            where: { cartId: foundCart.cartId }
        });

        if (itemCount === 0) {
            await cart.delete({ where: { cartId: foundCart.cartId } });
            console.log("Cart was empty, deleted cart");
        }

        return res.status(200).json({ success: true, message: 'Item removed' });
    } catch (error) {
        console.error("Error in removeFromCart:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};


const clearCart = async (req, res) => {
    try {
        const userId = req.user.userId;

        const foundCart = await cart.findUnique({ where: { userId } });

        if (!foundCart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const deletedItems = await cartItem.deleteMany({
            where: { cartId: foundCart.cartId }
        });

        //if user's cart is empty => delete it
        await cart.delete({ where: { cartId: foundCart.cartId } });
        console.log("Cleared cart and deleted cart container");

        return res.status(200).json({ success: true, deletedItems });
    } catch (error) {
        console.error("Error in clearCart:", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};


module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};


