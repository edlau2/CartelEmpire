const fs = require("fs");
const path = require("path");

function createLogger(loggingConfig) {
  const { console: toConsole, file: toFile, directory, maxDays } = loggingConfig;

  // Ensure log directory exists
  if (toFile) {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }

  function getLogFilePath() {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return path.join(directory, `app-${date}.log`);
  }

  function rotateLogs() {
    if (!toFile) return;

    const files = fs.readdirSync(directory);
    const cutoff = Date.now() - maxDays * 86400000; // ms in N days

    for (const file of files) {
      const fullPath = path.join(directory, file);

      try {
        const stats = fs.statSync(fullPath);
        if (stats.mtimeMs < cutoff) {
          fs.unlinkSync(fullPath);
        }
      } catch (err) {
        console.error("Log cleanup error:", err);
      }
    }
  }

  // Run rotation on startup
  rotateLogs();

  function write(message) {
    if (toConsole) console.log(message);
    if (toFile) {
      fs.appendFile(getLogFilePath(), message + "\n", err => {
        if (err) console.error("Log write error:", err);
      });
    }
  }

  return {
    log(...args) {
      write(`[${new Date().toISOString()}] ${args.join(" ")}`);
    },
    error(...args) {
      write(`[${new Date().toISOString()}] ERROR: ${args.join(" ")}`);
    }
  };
}

module.exports = { createLogger };
