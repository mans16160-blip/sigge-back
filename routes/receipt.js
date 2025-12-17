const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/receiptController");
const pdfController = require("../controllers/pdfController");
const verifyToken = require("../middleware/verifytoken");
const logger = require("../logger");

router.post("/", (req, res, next) => {
  logger.info("POST /receipt - createReceipt called");
  receiptController.createReceipt(req, res, next);
});

router.get("/", verifyToken, (req, res, next) => {
  logger.info("GET /receipt - getAllReceipts called");
  receiptController.getAllReceipts(req, res, next);
});

router.get("/user/:user", verifyToken, (req, res, next) => {
  logger.info("GET /receipt - getUserReceipts called");
  receiptController.getUserReceipts(req, res, next);
});

router.get("/:id", (req, res, next) => {
  logger.info(`GET /receipt/${req.params.id} - getReceiptById called`);
  receiptController.getReceiptById(req, res, next);
});

router.put("/:id", verifyToken, (req, res, next) => {
  logger.info(`PUT /receipt/${req.params.id} - updateReceipt called`);
  receiptController.updateReceipt(req, res, next);
});

router.delete("/:id", verifyToken, (req, res, next) => {
  logger.info(`DELETE /receipt/${req.params.id} - deleteReceipt called`);
  receiptController.deleteReceipt(req, res, next);
});

router.get("/:id/pdf", (req, res, next) => {
  logger.info(`GET /receipt/${req.params.id}/pdf - getPdfById called`);
  receiptController.generatePDF(req, res, next);
});

module.exports = router;
