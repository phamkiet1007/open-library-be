const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const user = prisma.user;

const getUserInformation = async (req, res) => {
    try {
        const { username } = req.query;

        const foundUser = await user.findUnique({
            where: { username: username },
            select: {
                userId: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                address: true
            }
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
            return res.status(400).json({error: "User not found!"});
        }

        // foundBook.categories = foundBook.categories.map(cat => cat.category.name);

        res.status(200).json(foundUser);
    } catch (error) {
        res.status(400).json(error);
    }
};

module.exports = {
    getUserInformation
}