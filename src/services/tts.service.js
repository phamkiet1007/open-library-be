// const pdfParse = require("pdf-parse");
// const gTTS = require("gtts");
// const { v4: uuidv4 } = require("uuid");
// const supabase = require("../configs/supabaseClient");
// const { getVietnamTime } = require("../utils/date.utils");
// const { PrismaClient } = require("@prisma/client");
// const fs = require("fs/promises");
// const path = require("path");

// const { book } = new PrismaClient({
//   log: ["query", "info", "warn", "error"],
// });

// //create audio from pdf (20 first pages / 5000 first characters)
// const generatePreviewAudioFromPdf = async (req, res) => {
//   try {
//     const { bookId } = req.params;

//     const foundBook = await book.findUnique({
//       where: { bookId: parseInt(bookId) },
//     });

//     if (!foundBook || !foundBook.filePath) {
//       return res.status(404).json({ error: "Book not found or missing PDF file" });
//     }

//     // Load file PDF from Supabase
//     const fileResponse = await fetch(foundBook.filePath);
//     if (!fileResponse.ok) {
//       return res.status(400).json({ error: "Unable to fetch PDF from storage" });
//     }

//     const pdfBuffer = await fileResponse.arrayBuffer();
//     const pdfData = await pdfParse(Buffer.from(pdfBuffer));

//     const text = pdfData.text
//       .split("\n")
//       .slice(0, 1500)
//       .join(" ")
//       .slice(0, 5000); // gTTS limit is about 5000 characters per request

//     // Generate MP3 using gTTS
//     const gtts = new gTTS(text, /[àáạảãâầấậẩẫăằắặẳẵđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹ]/i.test(text) ? "vi" : "en");
//     const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
//     const fileName = `${timestamp}-${uuidv4()}.mp3`;

//     const tempPath = path.join(__dirname, "..", "temp", fileName);

//     // Ensure /temp exists (create if not)
//     await fs.mkdir(path.dirname(tempPath), { recursive: true });
//     await new Promise((resolve, reject) => {
//       gtts.save(tempPath, (err) => {
//         if (err) reject(err);
//         else resolve();
//       });
//     });

//     // Read file buffer for upload
//     const mp3Buffer = await fs.readFile(tempPath);

//     // Upload to Supabase Storage
//     const { error: uploadError } = await supabase.storage
//       .from("books-mp3")
//       .upload(fileName, mp3Buffer, {
//         contentType: "audio/mpeg",
//         upsert: true,
//       });

//     // Cleanup local temp file
//     await fs.unlink(tempPath);

//     if (uploadError) {
//       throw new Error(`Upload failed: ${uploadError.message}`);
//     }

//     const { data: publicUrlData } = supabase.storage
//       .from("books-mp3")
//       .getPublicUrl(fileName);

//     if (!publicUrlData) {
//       throw new Error("Failed to get public URL for the uploaded file");
//     }

//     // Update book record with the new audio URL
//     await book.update({
//       where: { bookId: parseInt(bookId) },
//         data: {
//           previewAudioUrl: publicUrlData.publicUrl,
//         },
//     });

//     res.status(200).json({
//       message: "Audio preview generated successfully",
//       audioUrl: publicUrlData.publicUrl,
//     });

//     console.log("cool bro, successfully generated audio");
//   } catch (error) {
//     console.error("TTS Error:", error);
//     res.status(500).json({
//       error: "Failed to generate audio preview",
//       message: error.message,
//     });
//   }
// };

// module.exports = {
//   generatePreviewAudioFromPdf,
// };
