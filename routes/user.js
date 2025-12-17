const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const verifyToken = require("../middleware/verifytoken");
const logger = require("../logger");

router.post("/reset-password", verifyToken, (req, res, next) => {
  logger.info("POST /reset-password called");
  authController.resetPassword(req, res, next);
});

router.post("/", verifyToken, (req, res, next) => {
  logger.info("POST / (createUser) called");
  userController.createUser(req, res, next);
});

router.get("/", verifyToken, (req, res, next) => {
  logger.info("GET / (getAllUsers) called");
  userController.getAllUsers(req, res, next);
});

router.put("/:id", verifyToken, (req, res, next) => {
  logger.info(`PUT /${req.params.id} (updateUser) called`);
  userController.updateUser(req, res, next);
});

router.delete("/:id", verifyToken, (req, res, next) => {
  logger.info(`DELETE /${req.params.id} (deleteUser) called`);
  userController.deleteUser(req, res, next);
});

router.get("/:id", verifyToken, (req, res, next) => {
  logger.info(`GET /${req.params.id} (getUserById) called`);
  userController.getUserById(req, res, next);
});

module.exports = router;
