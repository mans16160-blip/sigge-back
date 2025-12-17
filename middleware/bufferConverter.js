const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");

const s3 = new S3Client({ region: "eu-north-1" });
const bucket = process.env.S3_BUCKET;

exports.uploadBuffer = async (buffer, filename, expiresInSeconds = 3600) => {
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${filename}.pdf`;
  console.log(key);

  // 1) If it already exists, just return a signed URL
  /*const exists = await objectExists(key);
  if (exists) {
    return await getReadUrl(key, expiresInSeconds);
  }*/

  // 2) Otherwise upload, then return a signed URL
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
    })
  );

  return await getReadUrl(key, expiresInSeconds);
};

async function objectExists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true; // HEAD succeeded => object exists
  } catch (err) {
    // If it's a 404/NotFound, it doesn't exist; otherwise rethrow
    const status = err?.$metadata?.httpStatusCode;
    if (status === 404 || err?.name === "NotFound") return false;
    throw err;
  }
}

async function getReadUrl(key, seconds = 3600) {
  return await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: seconds }
  );
}