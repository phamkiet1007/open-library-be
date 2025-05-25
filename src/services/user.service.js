const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
      // include: {
      //     categories: {
      //         include: {
      //             category: {
      //                 select: {
      //                     name: true
      //                 }
      //             }
      //         }
      //     },
      //     orders: {
      //         include: {
      //             user: {
      //                 select: {
      //                     userId: true,
      //                     username: true
      //                 }
      //             }
      //         }
      //     }
      // }
    });

    if (!foundUser) {
      return res.status(400).json({ error: "User not found!" });
    }

    // foundBook.categories = foundBook.categories.map(cat => cat.category.name);

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

    // Add updated_at timestamp
    updateData.updated_at = new Date();

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
        userId: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        address: true,
        updated_at: true,
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

module.exports = {
  getUserInformation,
  updateUserProfile,
};
