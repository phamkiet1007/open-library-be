import crypto from 'crypto';

/*Create verification-token function*/
export const generateVerificationToken = () => {
    //create random token with 6 chars
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

