// Script to check and fix duplicate usernames in the database
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixDuplicateUsernames() {
  try {
    console.log("Starting duplicate username check...");

    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} total users`);

    // Create a map to track usernames
    const usernameMap = new Map();
    const duplicates = [];

    // Find duplicates
    users.forEach((user) => {
      if (usernameMap.has(user.username)) {
        duplicates.push(user);
      } else {
        usernameMap.set(user.username, user.userId);
      }
    });

    console.log(`Found ${duplicates.length} users with duplicate usernames`);

    // Fix duplicates by appending a number to their usernames
    for (const user of duplicates) {
      const newUsername = `${user.username}_${Math.floor(
        Math.random() * 1000
      )}`;
      console.log(
        `Updating user ${user.userId}: ${user.username} -> ${newUsername}`
      );

      await prisma.user.update({
        where: { userId: user.userId },
        data: { username: newUsername },
      });
    }

    console.log("Duplicate username fix completed successfully!");
  } catch (error) {
    console.error("Error fixing duplicate usernames:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
fixDuplicateUsernames();
