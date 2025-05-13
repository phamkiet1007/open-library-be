const { PrismaClient } = require('@prisma/client');
const { getVietnamTime } = require('../utils/date.utils');
const { generateTransactionId } = require('../utils/generate_transaction_id');

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"]
});
const { payment, order } = prisma;

/**
 * Create payment for an order
 */
const createPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const transaction_id = generateTransactionId(userId);
    const { orderId, payment_method } = req.body;

    // Check if order exists and belongs to current user
    const existingOrder = await order.findUnique({
      where: { orderId },
      include: { payments: true }
    });

    if (!existingOrder || existingOrder.userId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized or order not found" });
    }

    if (existingOrder.payments && existingOrder.payments.length > 0) {
      return res.status(409).json({ success: false, message: "Order already has payment" });
    }

    const amount = existingOrder.total_amount;

    // Prevent duplicate payments
    const existingTx = await payment.findUnique({ where: { transaction_id } });
    if (existingTx) {
      return res.status(409).json({ success: false, message: "Transaction already exists" });
    }

    // Create payment
    const newPayment = await payment.create({
      data: {
        orderId,
        amount,
        payment_method,
        transaction_id,
        payment_date: getVietnamTime()
      }
    });

    // Update order status to 'PAID'
    await order.update({
      where: { orderId },
      data: { status: 'PAID' }
    });

    res.status(201).json({ isPaid: true, payment: newPayment });
  } catch (error) {
    console.error("Error in createPayment:", error);
    res.status(500).json({ isPaid: false, message: error.message });
  }
};

/**
 * Get payments of a specific user
 */
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const payments = await payment.findMany({
      where: {
        order: {
          userId
        }
      },
      include: {
        order: true
      },
      orderBy: {
        payment_date: 'desc'
      }
    });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    console.error("Error in getUserPayments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Get all payments
 */
const getAllPayments = async (req, res) => {
  try {
    const payments = await payment.findMany({
      include: {
        order: {
          include: { user: true }
        }
      },
      orderBy: {
        payment_date: 'desc'
      }
    });

    res.status(200).json({ success: true, payments });
  } catch (error) {
    console.error("Error in getAllPayments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPayment,
  getUserPayments,
  getAllPayments
};
