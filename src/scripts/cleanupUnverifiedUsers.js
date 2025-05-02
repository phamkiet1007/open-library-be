//this file is a cron job to clean up redundant data

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cleanupUnverifiedUsers = async () => {
  try {
    const now = new Date();

    const usersToDelete = await prisma.user.findMany({
      where: {
        email_verification: 'NOT_VERIFIED',
        verificationToken: {
          some: {
            expiresAt: { lt: now }
          }
        }
      }
    });

    console.log(`Found ${usersToDelete.length} unverified users to delete.`);

    for (const user of usersToDelete) {
      await prisma.verificationToken.deleteMany({
        where: { userId: user.userId }
      });

      await prisma.user.delete({
        where: { userId: user.userId }
      });

      console.log(`Deleted user ID: ${user.userId}`);
    }

    console.log('Cleanup complete.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
};

cleanupUnverifiedUsers();
