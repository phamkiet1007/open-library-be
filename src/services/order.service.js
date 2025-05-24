const { PrismaClient } = require('@prisma/client');
const { getVietnamTime } = require('../utils/date.utils');

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"]
});
const { cart, cartItem, order, orderItem, payment } = prisma;

//create order form from cart
const createOrderFromCart = async (req, res) => {
  //Get user's cart
  try {
    const userId = req.user.userId;

    const { selectedBookIds } = req.body; //array of books selected to order

    const foundCart = await cart.findUnique({
    where: { userId },
        include: {
            items: {
                include: { book: true }
            }
        }
    });

    if (!foundCart || foundCart.items.length === 0) {
        return res.status(400).json({error: "There is no items in user's cart"});
    }

    /*select books to order */
    const selectedItems = foundCart.items.filter(item =>
      selectedBookIds.includes(item.bookId)
    );

    if (selectedItems.length === 0) {
      return res.status(400).json({ error: "No matching books in your cart" });
    }
    /*select books to order */
    
    //check for the available quantity 
    for (const item of selectedItems) {
      if (item.book.quantity_available < item.quantity) {
        return res.status(400).json({ error: `Not enough stock for book "${item.book.title}"` });
      }
    }

    //compute totalCost
    const totalAmount = foundCart.items.reduce((sum, item) => {
        return sum + item.book.price * item.quantity;
    }, 0);

    //create new order form
    const newOrder = await order.create({
        data: {
            user: { connect: { userId } },
            total_amount: totalAmount,
            status: 'PENDING',
            order_date: getVietnamTime(),
            orderItems: {
                create: foundCart.items.map(item => ({
                bookId: item.bookId,
                quantity: item.quantity,
                price_per_unit: item.book.price
                }))
            }
        }
    });

    //delete all selected items in Cart
    await cartItem.deleteMany({ 
        where: { 
        cartId: foundCart.cartId,
        bookId: { in: selectedBookIds }
        } 
    });

    //check for remaining items, if no items left => delete cart
    const remainingItems = await cartItem.findMany({
      where: { cartId: foundCart.cartId }
    });
    if (remainingItems.length === 0) {
      await cart.delete({ where: { cartId: foundCart.cartId } });
    }

    res.status(200).json({ isOrdered: true, order: newOrder });

    } catch (error) {
        res.status(500).json({ isOrdered: false, error });
    }
};

//Get orders of user by username
const getOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.user.userId;
        const orders = await order.findMany({
            where: { userId },
            include: {
            orderItems: {
                include: { book: true }
            },
            payments: true
            },
            orderBy: { order_date: 'desc' }
        });

        res.status(200).json(orders);
    } catch (error) {
        res.status(400).json(error);
    }
  
};

// user can click on buyNow, don't need to buy through cart
const buyNow = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bookId, quantity = 1 } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const book = await prisma.book.findUnique({ where: { bookId } });
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    //check for the available quantity
    if (book.quantity_available < quantity) {
      return res.status(400).json({ success: false, message: "Not enough stock available" });
    }

    const totalAmount = book.price * quantity;

    const newOrder = await prisma.order.create({
      data: {
        user: { connect: { userId } },
        total_amount: totalAmount,
        status: 'PENDING',
        order_date: getVietnamTime(),
        orderItems: {
          create: [{
            bookId,
            quantity,
            price_per_unit: book.price
          }]
        }
      }
    });

   
    res.status(201).json({ success: true, order: newOrder });
  } catch (error) {
    console.error("Error in buyNow:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
  createOrderFromCart,
  getOrdersByUser,
  buyNow
};
