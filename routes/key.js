const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const verifyToken = require("../middleware/verifytoken");
const logger = require("../logger");

router.get("/openai", verifyToken, (req, res, next) => {
  logger.info("GET /openai called");
  res.status(200).json({ key: process.env.OPENAI_API_KEY });
});
module.exports = router;
