import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {PrismaClient} from "@prisma/client";


const { user } = new PrismaClient({
    log: ["query", "info", "warn", "error"]
});

const createAccessToken = (payload) => {
    console.log(payload);
    return jwt.sign({payload}, process.env.JWT_SECRET, {
        algorithm: process.env.HASH_ALGORITHM,
        expiresIn: process.env.JWT_TTL,
    })
}

const verifyAccessToken = (accessToken) => {
    try {
        return jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (error) {
        return false;
    }
}

const middlewareToken = async (req, res, next) => {
    const {authorization} = req.headers;

    if (!authorization) {
        return res.status(401).send({ error: 'Unauthorized' });
    }

    const checkToken = verifyAccessToken(authorization);
    if (!checkToken) {
        return res.status(401).send({ error: 'Unauthorized' });
    }


    const userId = checkToken.payload.userId;

    const userExist = await user.findFirst({
        where: {
            id: userId
        }
    });

    if (!userExist) {
        return res.status(401).send({ error: 'Unauthorized' });
    }

    req.userId = userId;
    next();
};



export {
    createAccessToken,
    middlewareToken
}