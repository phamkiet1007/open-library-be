const multer = require('multer');
const path = require('path');

// Config upload cover images
const coverImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/coverImages/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Config upload book files
const bookFileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/bookFiles/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// File filters (optional)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type.'), false);
    }
};

const uploadCoverImage = multer({ storage: coverImageStorage, fileFilter });
const uploadBookFile = multer({ storage: bookFileStorage, fileFilter });

module.exports = {
    uploadCoverImage,
    uploadBookFile
};
