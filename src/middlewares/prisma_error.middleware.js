const { Prisma } = require('@prisma/client');
const { BAD_REQUEST, CONFLICT, NOT_FOUND, GENERAL_ERROR } = require('../helpers/error.helper');

const prismaErrorHandler = (err, req, res, next) => {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        let statusCode = BAD_REQUEST;
        let message = 'Database error';

        switch (err.code) {
            case 'P2002':
                statusCode = CONFLICT;
                message = `Duplicate value for field: ${err.meta?.target?.join(', ')}`;
                break;

            case 'P2025':
                statusCode = NOT_FOUND;
                message = 'Record not found.';
                break;

            case 'P2003':
                statusCode = BAD_REQUEST;
                message = 'Foreign key constraint failed.';
                break;

            case 'P2014':
                statusCode = BAD_REQUEST;
                message = 'Invalid relation between records.';
                break;

            case 'P2000':
                statusCode = BAD_REQUEST;
                message = 'Input too long for field.';
                break;

            case 'P2016':
                statusCode = NOT_FOUND;
                message = 'Query result not found.';
                break;

            default:
                statusCode = GENERAL_ERROR;
                message = `Unexpected Prisma error (code ${err.code})`;
                break;
        }

        return res.status(statusCode).json({
            ok: false,
            message,
            errors: [err.meta || {}],
        });
    }

    //validate input (wrong type data)
    if (err instanceof Prisma.PrismaClientValidationError) {
        return res.status(BAD_REQUEST).json({
            ok: false,
            message: 'Invalid input data.',
            errors: [err.message],
        });
    }

    //if the error isn't belong to Primsa, pass it to the next middleware
    next(err);
};

module.exports = prismaErrorHandler;
