const path = require("path");
const fs = require("fs");
const axios = require("axios");
const logger = require("../logger");
async function cacheImage(imageUrl, id) {
  try {
    const cacheDir = path.join(__dirname, "../cachedImages"); // Make a cache folder
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const ext = path.extname(imageUrl).split("?")[0] || ".jpg";
    const localPath = path.join(cacheDir, `${id}${ext}`);

    // Check if already downloaded
    if (!fs.existsSync(localPath)) {
      logger.info(` Downloading image for ID ${id}...`);
      const res = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      fs.writeFileSync(localPath, res.data);
    } else {
      logger.info(`Using cached image for ID ${id}`);
    }

    return localPath;
  } catch (err) {
    logger.error(`Failed to download image for ID ${id}:`, err);
    return null; // Fallback
  }
}

module.exports = { cacheImage };
