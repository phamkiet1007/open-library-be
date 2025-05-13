const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { isAdmin, isMember } = require('../middlewares/role.middleware');

const { 
    createPayment,
    getUserPayments,
    getAllPayments
} = require('../services/payment.service');


router.post('/', authenticate, createPayment); //
router.get('/payments-history', authenticate, getUserPayments);  //
router.get('/admin/all-payments', authenticate, isAdmin, getAllPayments); //


module.exports = router;

