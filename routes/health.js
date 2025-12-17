const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.get("/", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", db: "connected" });
  } catch (err) {
    res
      .status(500)
      .json({ status: "fail", db: "disconnected", error: err.message });
  }
});

module.exports = router;
