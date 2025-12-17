const log4js = require("log4js");
const path = require("path");

log4js.configure({
  appenders: {
    out: { type: "console" },
    appFile: { type: "file", filename: "logs/app.log" },
    errorFile: { type: "file", filename: "logs/error.log" },
    errorFilter: {
      type: "logLevelFilter",
      appender: "errorFile",
      level: "error",
    },
  },
  categories: {
    default: {
      appenders: ["out", "appFile", "errorFilter"],
      level: "trace", // capture everything
    },
  },
});

const logger = log4js.getLogger();

function getCallerInfo() {
  const stack = new Error().stack?.split("\n") || [];
  const callerLine = stack[3] || stack[2];
  const match = callerLine.match(/\((.*):(\d+):(\d+)\)/);
  if (match) {
    const [, file, line] = match;
    return `${path.basename(file)}:${line}`;
  }
  return "unknown";
}

// Wrap each log level to include caller info
["trace", "debug", "info", "warn", "error", "fatal"].forEach((level) => {
  const original = logger[level].bind(logger);
  logger[level] = (...args) => {
    const callerInfo = getCallerInfo();
    original(`[${callerInfo}]`, ...args);
  };
});

module.exports = logger;
