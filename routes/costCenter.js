const express = require("express");
const router = express.Router();

const costCenterController = require("../controllers/costCenterController");
const verifyToken = require("../middleware/verifytoken");
const logger = require("../logger");

router.post("/", (req, res, next) => {
  logger.info("POST /cost-centers - createCostCenter called");
  costCenterController.createCostCenter(req, res, next);
});

router.get("/", verifyToken, (req, res, next) => {
  logger.info("GET /cost-centers - getAllCostCenters called");
  costCenterController.getAllCostCenters(req, res, next);
});

router.put("/:id", verifyToken, (req, res, next) => {
  logger.info(`PUT /cost-centers/${req.params.id} - updateCostCenter called`);
  costCenterController.updateCostCenter(req, res, next);
});

router.delete("/:id", verifyToken, (req, res, next) => {
  logger.info(
    `DELETE /cost-centers/${req.params.id} - deleteCostCenter called`,
  );
  costCenterController.deleteCostCenter(req, res, next);
});

router.get("/:id", (req, res, next) => {
  logger.info(`GET /cost-centers/${req.params.id} - getCostCenterById called`);
  costCenterController.getCostCenterById(req, res, next);
});

module.exports = router;
