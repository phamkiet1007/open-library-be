const nodemailer = require('nodemailer');
const format = require('string-template');
const debug = require('debug')('order:email');
require('dotenv').config();


const GMAIL_HOST = process.env.GMAIL_HOST;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO;
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
        to: EMAIL_TO,
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

module.exports = { sendConfirmationMail };