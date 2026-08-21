import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface UploadResult {
  url:  string;
  key:  string;
}

export class StorageService {
  async upload(
    buffer:   Buffer,
    filename: string,
    mimeType: string
  ): Promise<UploadResult> {
    switch (env.STORAGE_PROVIDER) {
      case 's3':        return this.uploadS3(buffer, filename, mimeType);
      case 'cloudinary': return this.uploadCloudinary(buffer, filename);
      default:          return this.uploadLocal(buffer, filename);
    }
  }

  async delete(key: string): Promise<void> {
    switch (env.STORAGE_PROVIDER) {
      case 's3':        return this.deleteS3(key);
      case 'cloudinary': return this.deleteCloudinary(key);
      default:          return this.deleteLocal(key);
    }
  }


  private async uploadLocal(buffer: Buffer, filename: string): Promise<UploadResult> {
    const dir = path.resolve(env.STORAGE_LOCAL_DIR);
    fs.mkdirSync(dir, { recursive: true });

    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const dest = path.join(dir, safe);
    fs.writeFileSync(dest, buffer);

    const url = `${env.BACKEND_URL}/uploads/${safe}`;
    logger.debug('Stored locally', { key: safe });
    return { url, key: safe };
  }

  private async deleteLocal(key: string): Promise<void> {
    const filePath = path.join(path.resolve(env.STORAGE_LOCAL_DIR), key);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }


  private async uploadS3(buffer: Buffer, filename: string, mimeType: string): Promise<UploadResult> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — optional dep: install @aws-sdk/client-s3 if using S3
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({
      region: env.AWS_REGION,
      credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_KEY },
    });

    const key = `certichain/${Date.now()}-${filename}`;
    await client.send(new PutObjectCommand({
      Bucket:      env.AWS_S3_BUCKET,
      Key:         key,
      Body:        buffer,
      ContentType: mimeType,
    }));

    const url = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
    return { url, key };
  }

  private async deleteS3(key: string): Promise<void> {
    // @ts-ignore — optional dep
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({ region: env.AWS_REGION });
    await client.send(new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }));
  }


  private async uploadCloudinary(buffer: Buffer, filename: string): Promise<UploadResult> {
    // @ts-ignore — optional dep: install cloudinary if using Cloudinary storage
    const { v2: cloudinary } = await import('cloudinary');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? '',
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'auto', public_id: `certichain/${filename}` },
        // @ts-ignore
        (err: any, res: any) => { if (err) reject(err); else resolve(res); }
      ).end(buffer);
    });

    return { url: result.secure_url, key: result.public_id };
  }

  private async deleteCloudinary(key: string): Promise<void> {
    // @ts-ignore — optional dep
    const { v2: cloudinary } = await import('cloudinary');
    await cloudinary.uploader.destroy(key);
  }
}

export const storageService = new StorageService();
