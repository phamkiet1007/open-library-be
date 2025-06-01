require("dotenv").config();

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createAccessToken } = require("../helpers/jwt.helper");
const { sendConfirmationMail } = require("../utils/send_email.utils");
const { getVietnamTime } = require("../utils/date.utils");
const { generateVerificationToken } = require("../utils/generate_token.utils");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const user = prisma.user;

const {
  createError,
  CONFLICT,
  BAD_REQUEST,
  UNAUTHORIZED,
  NOT_FOUND,
  GENERAL_ERROR,
} = require("../helpers/error.helper");

const SALT_ROUNDS = 10;

/*Register function */
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, address, role } =
      req.body;

    if (!username || !email || !password || !address) {
      throw createError({
        status: BAD_REQUEST,
        message: "Missing required fields",
      });
    }

    //Check if there is a user
    const userExists = await user.findUnique({ where: { email } });
    if (userExists) {
      throw createError({
        status: CONFLICT,
        message: "Account already exists, please login!",
      });
    }

    //Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    //create token
    const verificationToken = generateVerificationToken();

    //Create new user
    const newUser = await user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        address,
        role: role === "ADMIN" ? "ADMIN" : "MEMBER",
        created_at: getVietnamTime(),
      },
      select: {
        userId: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        address: true,
        role: true,
      },
    });

    //create verification token
    await prisma.verificationToken.create({
      data: {
        token: verificationToken,
        userId: newUser.userId,
        type: "EMAIL_VERIFICATION",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), //15mins
      },
    });

    //send confirmation email with the token
    await sendConfirmationMail(
      verificationToken,
      newUser.username,
      newUser.email
    );

    res.json({
      isRegister: true,
      message: "Please check your email to verify your account!",
    });
  } catch (error) {
    throw createError({
      status: UNAUTHORIZED,
      message: error,
    });
  }
};

/*Verify email function */
const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      throw createError({
        status: BAD_REQUEST,
        message: "Token and email are required",
      });
    }

    //find user by email
    const foundUser = await user.findUnique({ where: { email } });
    if (!foundUser) {
      throw createError({
        status: NOT_FOUND,
        message: "User not found",
      });
    }

    //Check if validate token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        userId: foundUser.userId,
        token: token,
        expiresAt: {
          gt: new Date(), //non-expired Token
        },
      },
    });

    if (!verificationToken) {
      throw createError({
        status: BAD_REQUEST,
        message: "Invalid or expired verification token",
      });
    }

    //Update VERIFIED status
    const updatedUser = await user.update({
      where: { userId: foundUser.userId },
      data: { email_verification: "VERIFIED" },
      select: {
        userId: true,
        username: true,
        email: true,
        email_verification: true,
      },
    });

    //Delete token after successful verifying
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    res.json({ isVerify: true, message: "Verification successfully" });
  } catch (error) {
    console.error("Verify email error:", error);
    throw createError({ status: GENERAL_ERROR, message: error.message });
  }
};

/*Resend email function */
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw createError({
        status: BAD_REQUEST,
        message: "Email is required",
      });
    }

    //find user by email
    const foundUser = await user.findUnique({ where: { email } });
    if (!foundUser) {
      throw createError({
        status: NOT_FOUND,
        message: "User not found",
      });
    }

    //check for verify
    if (foundUser.email_verification === "VERIFIED") {
      throw createError({
        status: BAD_REQUEST,
        message: "This email is already verified",
      });
    }

    //delete old token
    await prisma.verificationToken.deleteMany({
      where: { userId: foundUser.userId },
    });

    //create new one
    const verificationToken = generateVerificationToken();

    //save new token
    await prisma.verificationToken.create({
      data: {
        token: verificationToken,
        userId: foundUser.userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), //24h
      },
    });

    //resend
    await sendConfirmationMail(
      verificationToken,
      foundUser.username,
      foundUser.email
    );

    res.json({
      isResend: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    throw createError({ status: GENERAL_ERROR, message: error.message });
  }
};

/*Login function */
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      throw createError({
        status: BAD_REQUEST,
        message: "Username/Email and Password are required",
      });
    }

    const isValidEmail = (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    };

    const isEmail = isValidEmail(identifier);

    const foundUser = await user.findUnique({
      where: isEmail ? { email: identifier } : { username: identifier },
    });

    if (!foundUser) {
      throw createError({
        status: UNAUTHORIZED,
        message: "Invalid email or username",
      });
    }

    if (foundUser.email_verification !== "VERIFIED") {
      // console.log('User not verified, current status:', foundUser.email_verification);
      throw createError({
        status: UNAUTHORIZED,
        message:
          "Your account is not verified. Please check your email to verify your account.",
      });
    }

    //Compare passwords
    const isPasswordCorrect = await bcrypt.compare(
      password,
      foundUser.password
    );

    if (!isPasswordCorrect) {
      throw createError({
        status: UNAUTHORIZED,
        message: "Invalid password",
      });
    }

    //Create payload for the token
    const payload = {
      userId: foundUser.userId, //save to the correct id
      username: foundUser.username,
      email: foundUser.email,
      role: foundUser.role,
    };

    //Create JWT token
    const token = createAccessToken(payload);

    //Prepare user data to return (excluding sensitive information)
    const userData = {
      userId: foundUser.userId,
      username: foundUser.username,
      email: foundUser.email,
      firstName: foundUser.firstName,
      lastName: foundUser.lastName,
      role: foundUser.role,
    };

    //Return token and user data
    res.json({ isLogin: true, token, user: userData });
  } catch (error) {
    throw createError({
      status: UNAUTHORIZED,
      message: error,
    });
  }
};

module.exports = { register, login, verifyEmail, resendVerificationEmail };
