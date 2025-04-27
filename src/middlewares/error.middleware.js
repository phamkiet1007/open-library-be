const {
    BAD_REQUEST,
    CONFLICT,
    FORBIDDEN,
    GENERAL_ERROR,
    NOT_FOUND,
    UNAUTHORIZED,
} = require('../helpers/error.helper');

const unauthorized = (err, req, res, next) => {
    if (err.status !== UNAUTHORIZED) return next(err);

    res.status(UNAUTHORIZED).json({
        ok: false,
        message: err.message || 'Unauthorized',
        errors: [err],
    });
};

const forbidden = (err, req, res, next) => {
    if (err.status !== FORBIDDEN) return next(err);

    res.status(FORBIDDEN).json({
        ok: false,
        message: err.message || 'Forbidden',
        errors: [err],
    });
};

const conflict = (err, req, res, next) => {
    if (err.status !== CONFLICT) return next(err);

    res.status(CONFLICT).json({
        ok: false,
        message: err.message || 'Conflict',
        errors: [err],
    });
};

const badRequest = (err, req, res, next) => {
    if (err.status !== BAD_REQUEST) return next(err);

    res.status(BAD_REQUEST).json({
        ok: false,
        message: err.message || 'Bad Request',
        errors: [err],
    });
};

const notFound = (err, req, res, next) => {
    if (err.status !== NOT_FOUND) return next(err);

    res.status(NOT_FOUND).json({
        ok: false,
        message: err.message || 'The requested resource could not be found',
    });
};

const genericError = (err, req, res, next) => {
    if (err.status !== GENERAL_ERROR) return next(err);

    res.status(GENERAL_ERROR).json({
        ok: false,
        message: err.message || 'Internal Server Error',
        errors: [err],
    });
};

//if the error is undefined, send general error
const catchAll = (err, req, res, next) => {
    res.status(GENERAL_ERROR).json({
        ok: false,
        message: err.message || 'Internal Server Error',
        errors: [err],
    });
};

const exportTable = {
    unauthorized,
    forbidden,
    conflict,
    badRequest,
    notFound,
    genericError,
    catchAll,
};

//All exportable stored as an array so that we can include in express middleware by app.use()
const all = Object.values(exportTable);

module.exports = {
    ...exportTable,
    all,
};
