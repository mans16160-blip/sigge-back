const fs = require("fs");
const path = require("path");
const os = require("os");
const { Poppler } = require("node-poppler");
const poppler = new Poppler();
const Jimp = require("jimp");
const axios = require("axios");
const logger = require("../logger");
const { pool } = require("../db");
const TARGET_PAGE_HEIGHT = 1122; // Standard height in pixels
const PAGE_MARGIN = 30; // space between pages in pixels
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const mime = require("mime-types");
const uploadService = require("./uploadService");

const s3 = new S3Client({
  region: process.env.AWS_REGION, // e.g. "eu-north-1"
  // creds picked up automatically from env/IAM role
});
//const sharp = require("sharp");

const { PDFDocument } = require("pdf-lib");

const MAX_PDF_SIZE_MB = 50;
const MAX_PAGES = 150;

async function validatePDF(pdfBuffer) {
  // Granska storleken
  const pdfSizeMB = pdfBuffer.length / (1024 * 1024);
  if (pdfSizeMB > MAX_PDF_SIZE_MB) {
    throw new Error(`PDF too large (${pdfSizeMB.toFixed(1)}MB)`);
  }

  // Granska sidantalet
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pageCount = pdfDoc.getPageCount();

  if (pageCount > MAX_PAGES) {
    throw new Error(`PDF has too many pages (${pageCount})`);
  }
}

exports.uploadPDF = async (file) => {
  const pdfBuffer = file.buffer;
  const clientId = process.env.IMGUR_CLIENT;

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-img-"));
  logger.info(`Temporary directory created: ${tempDir}`);

  try {
    //Generera pdf-buffers
    const pageBuffers = await renderPdfPagesToBuffers(pdfBuffer, tempDir);
    await validatePDF(pdfBuffer);
    //Gör om till bilder
    const convertedImageBuffer = await convertToImageBuffers(pageBuffers);
    //Ladda upp
    const imgurLinks = await uploadService.uploadToS3(convertedImageBuffer);
    return imgurLinks;
  } catch (error) {
    logger.error("Error in uploadPDF:", error);
    throw new Error("PDF upload process failed.");
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      logger.info(`Temporary directory deleted: ${tempDir}`);
    } catch (cleanupErr) {
      logger.warn(`Failed to clean up temp dir: ${tempDir}`, cleanupErr);
    }
  }
};

const sharp = require("sharp");

const FIT_MODE = "contain";

async function convertToImageBuffers(buffers) {
  return Promise.all(
    buffers.map(async (buf, i) => {
      return await sharp(buf, { limitInputPixels: false })
        /* .resize(TARGET_W, TARGET_H, {
        fit: FIT_MODE,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        kernel: sharp.kernel.lanczos3,
      })*/
        .sharpen(0.5, 1, 1) // subtle; remove if halos
        .png({ compressionLevel: 6, adaptiveFiltering: true }) // quality-safe
        // If JPEG is required:
        // .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: '4:4:4' })
        .toBuffer();
    }),
  );
}

/*async function renderPdfPagesToBuffers(pdfBuffer, outputDir) {
  logger.info("Starting PDF rendering to images...");
  const pdfPath = path.join(outputDir, "temp.pdf");

  try {
    fs.writeFileSync(pdfPath, pdfBuffer);
    const options = {
      format: "png",
      out_dir: outputDir,
      out_prefix: "page",
      page: null,
    };

    await poppler.convert(pdfPath, options);

    const imageFiles = fs
      .readdirSync(outputDir)
      .filter((name) => name.startsWith("page") && name.endsWith(".png"))
      .sort();

    if (imageFiles.length === 0) {
      throw new Error("No image pages were generated from the PDF.");
    }

    logger.info(`Rendered ${imageFiles.length} pages from PDF.`);
    return imageFiles.map((file) =>
      fs.readFileSync(path.join(outputDir, file)),
    );
  } catch (error) {
    logger.error("Error rendering PDF to images:", error);
    throw new Error("PDF rendering failed.");
  }
}*/

async function renderPdfPagesToBuffers(pdfBuffer, outputDir) {
  logger.info("Starting PDF rendering to images...");
  const pdfPath = path.join(outputDir, "temp.pdf");

  fs.writeFileSync(pdfPath, pdfBuffer);

  await poppler.pdfToCairo(pdfPath, path.join(outputDir, "page"), {
    pngFile: true,
    resolutionXYAxis: 300,
  });

  const imageFiles = fs
    .readdirSync(outputDir)
    .filter((name) => name.startsWith("page") && name.endsWith(".png"))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0], 10);
      const numB = parseInt(b.match(/\d+/)[0], 10);
      return numA - numB;
    });

  if (imageFiles.length === 0) {
    throw new Error("No image pages were generated from the PDF.");
  }

  logger.info(`Rendered ${imageFiles.length} pages from PDF in correct order.`);
  const resizedBuffers = [];
  for (const file of imageFiles) {
    const originalBuffer = fs.readFileSync(path.join(outputDir, file));
    /* const resizedBuffer = await sharp(originalBuffer)
      .resize({ height: 1500, withoutEnlargement: true })
      .jpeg({ quality: 20 })
      .toBuffer();*/
    resizedBuffers.push(originalBuffer);
  }

  return resizedBuffers;
}

/*async function uploadToImgur(buffers, clientId) {
  logger.info("Uploading multiple images to Imgur...");

  if (!Array.isArray(buffers)) buffers = [buffers];

  const imgurLinks = [];

  for (let i = 0; i < buffers.length; i++) {
    logger.info(`Uploading page ${i + 1} of ${buffers.length}...`);
    const base64Image = buffers[i].toString("base64");

    const response = await axios.post(
      "https://api.imgur.com/3/image",
      { image: base64Image, type: "base64" },
      { headers: { Authorization: `Client-ID ${clientId}` } },
    );

    if (!response.data.success) {
      throw new Error(`Imgur upload failed for page ${i + 1}`);
    }

    const link = response.data.data.link;
    logger.info(`Page ${i + 1} uploaded successfully: ${link}`);
    imgurLinks.push(link); // Keep order intact
  }
 

  return imgurLinks; // Array in correct order
}*/
