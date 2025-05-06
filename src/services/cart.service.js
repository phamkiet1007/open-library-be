const { getVietnamTime } = require('../utils/date.utils');


const { PrismaClient } = require('@prisma/client');
const { cart, cartItem } = new PrismaClient({
    log: ["query", "info", "warn", "error"]
});;

const getCart = async (req, res) => {
    try {
      const userId = req.user.userId;
      const foundCart = await cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: { book: true },
          },
        },
      });
  
      if (!foundCart) {
        return res.status(200).json({
          cartId: null,
          items: [],
          totalQuantity: 0,
          totalPrice: 0
        });
      }
  
      const transformedItems = foundCart.items.map((item) => ({
        bookId: item.bookId,
        quantity: item.quantity,
        title: item.book.title,
        price: item.book.price,
        coverImage: item.book.coverImage,
      }));
  
      const totalQuantity = foundCart.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = foundCart.items.reduce(
        (sum, item) => sum + item.quantity * item.book.price,
        0);
  
      res.status(200).json({
        cartId: foundCart.cartId,
        items: transformedItems,
        totalQuantity,
        totalPrice
      });
    } catch (error) {
      res.status(400).json(error);
    }
  };
  

const addToCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bookId, quantity } = req.body;

        console.log("id:", userId);
        console.log("BODY:", req.body);

    
        //find exist cart or add a new one
        let foundCart = await cart.findUnique({ where: { userId } });
    
        if (!foundCart) {
            foundCart = await cart.create({
            data: {
                user: { connect: { userId } },
                updatedAt: getVietnamTime(),
            }
            });
            console.log("Created new cart:", foundCart);
        } else {
            console.log("Found existing cart:", foundCart);
        }
    
        //check if cart already contains books 
        const existingItem = await cartItem.findUnique({
            where: {
            cartId_bookId: {
                cartId: foundCart.cartId,
                bookId: bookId
            }
            }
        });
    
        if (existingItem) {
            //if exist, update the quantity
            await cartItem.update({
            where: { cartId_bookId: { cartId: foundCart.cartId, bookId } },
            data: { quantity: existingItem.quantity + quantity }
            });
        } else {
            //if not, add new book
            await cartItem.create({
            data: {
                cart: { connect: { cartId: foundCart.cartId } },
                book: { connect: { bookId } },
                quantity
            }
            });
        }
    
        res.status(200).json({ success: true, message: 'Added to cart'});
    } catch (error) {
        res.status(400).json(error);
    }
};
  

const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bookId, quantity } = req.body;
    
        const foundCart = await cart.findUnique({ where: { userId } });
    
        if (!foundCart) {
            return res.status(404).json({ message: "Cart not found" });
        }
    
        await cartItem.update({
            where: {
            cartId_bookId: {
                cartId: foundCart.cartId,
                bookId
            }
            },
            data: {
            quantity
            }
        });
    
        res.status(200).json({ success: true, message: 'Quantity updated' });
    } catch (error) {
        res.status(400).json(error);
    }
};
  

const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { bookId } = req.body;

        const foundCart = await cart.findUnique({ where: { userId } });

        if (!foundCart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        //delete Item from cartItem schema
        await cartItem.delete({
            where: {
                cartId_bookId: {
                    cartId: foundCart.cartId,
                    bookId
                }
            }
        });

        //check if there are items in cartItem
        const remainingItems = await cartItem.findMany({
            where: { cartId: foundCart.cartId }
        });

        if (remainingItems.length === 0) {
            //if no, delete in Cart schema
            await cart.delete({
                where: { cartId: foundCart.cartId }
            });
            console.log("Cart was empty, deleted cart");
        }

        res.status(200).json({ success: true, message: 'Item removed' });

    } catch (error) {
        console.error("Error in removeFromCart:", error);
        res.status(500).json( error);
    }
};

  
  

const clearCart = async (req, res) => {
    try {
        const userId = req.user.userId;

        const foundCart = await cart.findUnique({ where: { userId } });
        
        if (!foundCart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const deletedItems = await cartItem.deleteMany({ where: { cartId: foundCart.cartId } });

        //check if there are items in cartItem
        const remainingItems = await cartItem.findMany({
            where: { cartId: foundCart.cartId }
        });

        if (remainingItems.length === 0) {
            //if no, delete in Cart schema
            await cart.delete({
                where: { cartId: foundCart.cartId }
            });
            console.log("Cart was empty, deleted cart");
        }

        res.status(200).json({ deletedAll: true, deletedItems});

    } catch (error) {
        console.log(error);
        res.status(400).json(error);
    }

};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};


