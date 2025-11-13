import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT;
export const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: endpoint && endpoint.length ? endpoint : undefined,
  forcePathStyle: !!endpoint, // R2/MinIO => true ; AWS pur => false
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
});

export const S3_BUCKET = process.env.S3_BUCKET!;
export const S3_PUBLIC_BASE = process.env.S3_PUBLIC_BASE!;
