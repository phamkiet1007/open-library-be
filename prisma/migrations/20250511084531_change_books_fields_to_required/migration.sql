/*
  Warnings:

  - Made the column `coverImage` on table `Book` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `Book` required. This step will fail if there are existing NULL values in that column.
  - Made the column `filePath` on table `Book` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isbn` on table `Book` required. This step will fail if there are existing NULL values in that column.
  - Made the column `publishDate` on table `Book` required. This step will fail if there are existing NULL values in that column.
  - Made the column `publisher` on table `Book` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Book" ALTER COLUMN "coverImage" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "filePath" SET NOT NULL,
ALTER COLUMN "isbn" SET NOT NULL,
ALTER COLUMN "publishDate" SET NOT NULL,
ALTER COLUMN "publisher" SET NOT NULL;
