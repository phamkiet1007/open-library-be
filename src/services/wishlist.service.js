const { PrismaClient } = require('@prisma/client');
const { getVietnamTime } = require('../utils/date.utils');

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"]
});
const {  } = prisma;

