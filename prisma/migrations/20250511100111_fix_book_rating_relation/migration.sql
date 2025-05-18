-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "averageRating" DOUBLE PRECISION,
ADD COLUMN     "totalRatings" INTEGER NOT NULL DEFAULT 0;
