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

    //delete all items in Cart if foundCart is empty
    await cartItem.deleteMany({ where: { cartId: foundCart.cartId } });
    await cart.delete({ where: { cartId: foundCart.cartId } });

    res.status(200).json(newOrder);

    } catch (error) {
        res.status(400).json(error);
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

module.exports = {
  createOrderFromCart,
  getOrdersByUser
};
