const axios = require("axios");
const logger = require("../logger");
const pdfService = require("../services/pdfService");
exports.handlePDFUpload = async (req, res) => {
  try {
    logger.info(`Starting PDF upload`);
    const links = await pdfService.uploadPDF(req.file, req.receipt_id);
    logger.info("PDF uploaded successfully!");
    res.json({
      message: "Upload successful",
      links: links,
    });
  } catch (err) {
    logger.error("Error in handlePDFUpload:", err);
    res.status(500).json({ error: err.message });
  }
};
