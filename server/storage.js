import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const accountId = process.env.R2_ACCOUNT_ID
const bucket = process.env.R2_BUCKET_NAME

export const objectStorage = accountId && bucket && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
  ? new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })
  : null

export const R2_BUCKET_NAME = bucket

function requireStorage() {
  if (!objectStorage || !R2_BUCKET_NAME) {
    throw new Error('Cloudflare R2 belum dikonfigurasi. Atur R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, dan R2_BUCKET_NAME.')
  }
  return objectStorage
}

export async function putObject(key, body, contentType) {
  await requireStorage().send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType || 'application/octet-stream',
  }))
}

export async function getObject(key) {
  return requireStorage().send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }))
}

export async function deleteObject(key) {
  await requireStorage().send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }))
}
