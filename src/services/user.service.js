const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcrypt");
const { generateVerificationToken } = require("../utils/generate_token.utils");
const { sendChangePasswordMail, sendSuccessPasswordChanged } = require('../utils/send_email.utils');

const user = prisma.user;

const getUserInformation = async (req, res) => {
  try {
    // Get username from the authenticated user in request
    const username = req.user.username;

    const foundUser = await user.findUnique({
      where: { username: username },
      select: {
        userId: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        address: true,
      },
    });

    if (!foundUser) {
      return res.status(400).json({ error: "User not found!" });
    }

    res.status(200).json(foundUser);
  } catch (error) {
    res.status(400).json(error);
  }
};

// Update user profile information
const updateUserProfile = async (req, res) => {
  try {
    // Get username from the authenticated user in request
    const username = req.user.username;

    // Extract all fields from request body that can be updated
    const updateData = {};

    // Process each field that could potentially be updated
    // Only include fields that are explicitly provided in the request
    const allowedFields = ["firstName", "lastName", "address"];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Validate input - at least one field must be provided
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error:
          "No valid fields to update. Please provide at least one of: firstName, lastName, or address.",
      });
    }

    // First check if user exists
    const userExists = await user.findUnique({
      where: { username },
      select: { userId: true },
    });

    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user information
    const updatedUser = await user.update({
      where: { username },
      data: updateData,
      select: {
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        address: true,
      },
    });

    res.status(200).json({
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({ error: "Internal server error during profile update" });
  }
};

// Reset password request
const requestPasswordChange = async (req, res) => {
  try {
    const username = req.user.username;
    const email  = req.user.email;
    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ error: "Current password is required." });
    }

    const foundUser = await prisma.user.findUnique({ where: { username } });
    if (!foundUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, foundUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const token = generateVerificationToken();

    //delete any existing verification tokens for password reset
    await prisma.VerificationToken.deleteMany({
      where: {
        userId: foundUser.userId,
        type: "PASSWORD_RESET",
      },
    });

    //create a new verification token for password reset
    await prisma.VerificationToken.create({
      data: {
        token,
        userId: foundUser.userId,
        type: "PASSWORD_RESET",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 phút
      },
    });

    //Send confirmation email with the token
    await sendChangePasswordMail(token, username, email);

    res.status(200).json({ message: "Verification token sent to email." });
  } catch (err) {
    console.error("requestPasswordChange error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};


// Enter token to confirm password change
const confirmPasswordChange = async (req, res) => {
  try {
    const username = req.user.username;
    const email  = req.user.email;

    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required." });
    }

    const foundUser = await prisma.user.findUnique({ where: { username } });
    if (!foundUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const validToken = await prisma.verificationToken.findFirst({
      where: {
        userId: foundUser.userId,
        token,
        type: "PASSWORD_RESET",
        expiresAt: { 
          gt: new Date() 
        }, //non-expired Token
      },
    });

    if (!validToken) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { userId: foundUser.userId },
        data: { password: hashedNewPassword },
      }),
      //delete token after changed
      prisma.verificationToken.delete({
        where: { id: validToken.id },
      }),
    ]);

    // Send successful email to user
    await sendSuccessPasswordChanged(username, email);

    res.status(200).json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("confirmPasswordChange error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};


/*(admin only)*/
const getAllUsers = async (req, res) => {
  try {
    const users = await user.findMany({
      select: {
        userId: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        address: true,
        isBlocked: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Block or unblock a user 
const toggleUserBlock = async (req, res) => {
  try {
    const { userId } = req.params;
    const { block } = req.body; // boolean: true (block), false (unblock)

    const parsedUserId = parseInt(userId);

    if (typeof block !== 'boolean') {
      return res.status(400).json({ error: "'block' must be true or false." });
    }

    const targetUser = await user.findUnique({ where: { userId: parsedUserId } });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }

    await user.update({
      where: { userId: parsedUserId },
      data: { isBlocked: block },
    });

    res.status(200).json({
      message: `User has been ${block ? "blocked" : "unblocked"}.`,
    });
  } catch (error) {
    console.error("toggleUserBlock error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete user 
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const parsedUserId = parseInt(userId);

    const existingUser = await user.findUnique({ where: { userId: parsedUserId } });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found." });
    }

    await user.delete({ where: { userId: parsedUserId } });

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("deleteUser error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
/*(admin only)*/


module.exports = {
  getUserInformation,
  updateUserProfile,
  requestPasswordChange,
  confirmPasswordChange,
  getAllUsers,
  toggleUserBlock,
  deleteUser,
};
