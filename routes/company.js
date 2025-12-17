const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const verifyToken = require("../middleware/verifytoken");
const logger = require("../logger");

router.post("/", (req, res, next) => {
  logger.info("POST /companies - createCompany called");
  companyController.createCompany(req, res, next);
});

router.get("/", verifyToken, (req, res, next) => {
  logger.info("GET /companies - getAllCompanies called");
  companyController.getAllCompanies(req, res, next);
});

router.put("/:id", verifyToken, (req, res, next) => {
  logger.info(`PUT /companies/${req.params.id} - updateCompany called`);
  companyController.updateCompany(req, res, next);
});

router.delete("/:id", verifyToken, (req, res, next) => {
  logger.info(`DELETE /companies/${req.params.id} - deleteCompany called`);
  companyController.deleteCompany(req, res, next);
});

router.get("/:id", (req, res, next) => {
  logger.info(`GET /companies/${req.params.id} - getCompanyById called`);
  companyController.getCompanyById(req, res, next);
});

module.exports = router;
