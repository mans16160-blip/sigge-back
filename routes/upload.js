const express = require("express");
const multer = require("multer");
const router = express.Router();
const pdfController = require("../controllers/pdfController");
const imageController = require("../controllers/imageController");
const logger = require("../logger");
const upload = multer({
  limits: {
    fieldSize: 20 * 1024 * 1024, // 20 MB per field — adjust if needed
  },
});

router.post("/", upload.single("file"), (req, res, next) => {
  logger.info("POST /upload - handleUpload called");

  if (req.file.mimetype == "application/pdf") {
    pdfController.handlePDFUpload(req, res, next);
  } else {
    imageController.handleUpload(req, res, next);
  }
});

module.exports = router;
