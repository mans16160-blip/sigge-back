const logger = require("../logger");
const { Upload } = require("@aws-sdk/lib-storage");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const mime = require("mime-types");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const s3 = new S3Client({
  region: process.env.AWS_REGION, // e.g. "eu-north-1"
  // creds picked up automatically from env/IAM role
});

exports.uploadToS3 = async (
  buffers,
  {
    bucket = process.env.S3_BUCKET,
    region = process.env.AWS_REGION,
    prefix = "uploads/",
    contentTypes = [],
    public: makePublic = true,
    signedTtl = 3600, // seconds
  } = {},
) => {
  try {
    logger.info("Uploading multiple images to S3...");

    if (!Array.isArray(buffers)) buffers = [buffers];

    const urls = [];

    for (let i = 0; i < buffers.length; i++) {
      logger.info(`Uploading page ${i + 1} of ${buffers.length} to S3...`);

      const buffer = buffers[i];

      // Prefer the provided content type for correct extension
      const contentType = contentTypes[i] || "image/png"; // default to an image type
      const ext = mime.extension(contentType) || "png";

      // Stable key: uploads/YYYY-MM-DD/uuid.ext
      const key = `${prefix}${new Date().toISOString().slice(0, 10)}/${uuidv4()}.${ext}`;

      // Multipart upload with retries/concurrency
      const uploader = new Upload({
        client: s3,
        params: {
          Bucket: bucket,
          Key: key,
          Body: buffer, // raw bytes
          ContentType: contentType, // ensures correct headers on download/view
          // ACL: makePublic ? "public-read" : undefined, // only if ACLs are enabled AND you want public objects
        },
        queueSize: 4,
        partSize: 10 * 1024 * 1024, // 10 MB
        leavePartsOnError: false,
      });

      await uploader.done();

      let url;
      if (makePublic) {
        // Plain, permanent URL (bucket policy/ACL must allow public read)
        url = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
      } else {
        // Short-lived signed URL for private objects
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        url = await getSignedUrl(s3, command, { expiresIn: signedTtl });
      }

      urls.push(url);
    }
    logger.info("URLS :" + urls);
    return urls;
  } catch {
    logger.error("Error uploading:", err);
    throw err;
  }
};
