export const generateTransactionId = (userId = "guest", prefix = "TXN") => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
  const random = Math.floor(1000 + Math.random() * 9000); //4 random numbers

  return `${prefix}_${userId}_${timestamp}_${random}`;
};


