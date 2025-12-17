require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { keycloak, memoryStore } = require("./keycloak");
const session = require("express-session");
const cron = require("node-cron");
const {
  generateAndEmailDailyReports,
} = require("./controllers/batchPDFController");
const logger = require("./logger");
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");
const config = require("./config");
// Create Redis client in legacy mode
const redisClient = createClient({ legacyMode: true });
redisClient.connect().catch(console.error);

// Configure express-session with RedisStore
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || "fallback-secret", // don't hardcode in prod
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true if using HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  }),
);

function convertTimeToCronFormat(timeStr) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr);
  if (!match) {
    logger.warn(`Invalid REPORT_TIME format: '${timeStr}', expected HH:MM`);
    return null;
  }

  let [, hour, minute] = match;
  hour = parseInt(hour, 10);
  minute = parseInt(minute, 10);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    logger.warn(`Invalid time values in REPORT_TIME: '${timeStr}'`);
    return null;
  }

  return `${minute} ${hour} * * *`;
}

const timeInput = process.env.REPORT_TIME || "00:00";
const cronTime = convertTimeToCronFormat(timeInput) || "0 0 * * *";

cron.schedule(cronTime, async () => {
  logger.info("Running daily report at midnight");
  try {
    await generateAndEmailDailyReports();
  } catch (err) {
    logger.info("Failed to generate or send reports:", err);
  }
});

app.use(express.json());

app.use(
  cors({
    origin: [process.env.CORS_ORIGIN, process.env.CORS_ORIGIN_LOCAL],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: false,
  }),
);

app.use("/uploads", express.static("uploads"));

app.use(
  session({
    secret: "some-secret",
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
  }),
);

if (!config.DISABLE_KEYCLOAK_PROTECTION) {
  app.use(keycloak.middleware());
  app.use(keycloak.protect());
}

const receiptRoutes = require("./routes/receipt");
const uploadRoutes = require("./routes/upload");
const userRoutes = require("./routes/user");
const costCenterRoutes = require("./routes/costCenter");
const companyRoutes = require("./routes/company");
const healthRoutes = require("./routes/health");
const keyRoutes = require("./routes/key");

app.use("/health", healthRoutes);
app.use("/receipt", receiptRoutes);
app.use("/upload", uploadRoutes);
app.use("/cost-center", costCenterRoutes);
app.use("/company", companyRoutes);
app.use("/user", userRoutes);
app.use("/key", keyRoutes);
// Health check
app.get("/", (req, res) => {
  res.send("Sigge API is running");
});

module.exports = app;
