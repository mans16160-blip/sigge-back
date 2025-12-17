const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const mime = require("mime-types");
const { v4: uuidv4 } = require("uuid");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = new S3Client({ region: process.env.AWS_REGION });
const uploadService = require("../services/uploadService");

exports.handleUpload = async (req, res) => {
  try {
    const buffer = req.file.buffer;
    const url = await uploadService.uploadToS3([buffer]);
    res.json({
      message: "Upload successful",
      links: url,
    });
  } catch (err) {
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
};
