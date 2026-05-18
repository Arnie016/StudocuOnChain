import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config.js";

const s3 = new S3Client({
  region: config.storage.region,
  endpoint: config.storage.endpoint,
  forcePathStyle: Boolean(config.storage.endpoint),
  credentials: {
    accessKeyId: config.storage.accessKeyId,
    secretAccessKey: config.storage.secretAccessKey
  }
});

export const createUploadUrl = async ({ key, contentType }) => getSignedUrl(
  s3,
  new PutObjectCommand({
    Bucket: config.storage.bucket,
    Key: key,
    ContentType: contentType
  }),
  { expiresIn: 300 }
);

export const createDownloadUrl = async ({ key }) => getSignedUrl(
  s3,
  new GetObjectCommand({
    Bucket: config.storage.bucket,
    Key: key
  }),
  { expiresIn: 120 }
);
