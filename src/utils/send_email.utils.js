const nodemailer = require('nodemailer');
const format = require('string-template');
const debug = require('debug')('order:email');
require('dotenv').config();


const GMAIL_HOST = process.env.GMAIL_HOST;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const EMAIL_CC = process.env.EMAIL_CC;
const EMAIL_BCC = process.env.EMAIL_BCC;

const email = `Hello {userName}👋,<br/><br/>
Welcome To Online Book Order App. Please use the token below to confirm your email address<br/>
<h3 style="
   color: blue;
   font-weight: bold;">{token}</h3>      
<br/><br/>
<p style="font-size: 15px;
   color: red;">N.B: Please don't reply to this email</p>
`;

const paymentSuccessTemplate = `
  <p>Hello <strong>{userName}</strong>,</p>
  <p>You have successfully paid for your order.</p>
  <ul>
    <li><strong>Order ID:</strong> {orderId}</li>
    <li><strong>Total amount:</strong> {formattedAmount} VND</li>
    <li><strong>Payment method:</strong> {payment_method}</li>
    <li><strong>Transaction ID:</strong> {transaction_id}</li>
  </ul>
  <p>Thank you for your purchase 📚</p>
  <p style="font-size: 14px; color: red;">Please do not reply to this email.</p>
`;

const changePasswordTemplate = `
        <p>Hello <strong>{userName}</strong>,</p>
        <p>We received a request to change your password.</p>
        <p>Your verification code is: <strong>{token}</strong></p>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
`;

const successChangeTemplate = `
        <p>Hi <strong>{userName}</strong>,</p>
        <p>Your password was successfully changed. If you didn't do this, please contact support immediately.</p>
`;


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
});

const sendConfirmationMail = async (token, userName, userEmail) => {
    const mailOptions = {
        from: GMAIL_USER,
        to: userEmail,
        cc: EMAIL_CC,
        bcc: EMAIL_BCC,
        subject: 'Confirm Your Email For Registration',
        html: format(email, {
            userName, 
            token,
        }),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

const sendChangePasswordMail = async (token, userName, userEmail) => {
    const mailOptions = {
        from: GMAIL_USER,
        to: userEmail,
        cc: EMAIL_CC,
        bcc: EMAIL_BCC,
        subject: 'Password Change Request',
        html: format(changePasswordTemplate, {
            userName, 
            token,
        }),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

const sendSuccessPasswordChanged = async (userName, userEmail) => {
    const mailOptions = {
        from: GMAIL_USER,
        to: userEmail,
        cc: EMAIL_CC,
        bcc: EMAIL_BCC,
        subject: 'Password Change Request',
        html: format(successChangeTemplate, {
            userName, 
        }),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};


const sendPaymentSuccessMail = async (userEmail, userName, amount, orderId, payment_method, transaction_id) => {
    const formattedAmount = Number(amount).toLocaleString('vi-VN');

    const mailOptions = {
        from: GMAIL_USER,
        to: userEmail,
        cc: EMAIL_CC,
        bcc: EMAIL_BCC,
        subject: 'Payment Successfully',
        html: format(paymentSuccessTemplate, {
            userName, 
            orderId,
            formattedAmount,
            payment_method,
            transaction_id
        }),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};



module.exports = { 
    sendConfirmationMail,
    sendPaymentSuccessMail,
    sendChangePasswordMail,
    sendSuccessPasswordChanged
};