import * as Minio from 'minio';

export class StorageService {
    private client: Minio.Client;
    private bucket: string;

    constructor(bucket: string = 'analysis-cache') {
        this.bucket = bucket;
        this.client = new Minio.Client({
            endPoint: process.env.MINIO_ENDPOINT || 'localhost',
            port: parseInt(process.env.MINIO_PORT || '9000'),
            useSSL: process.env.MINIO_USE_SSL === 'true',
            accessKey: process.env.MINIO_ROOT_USER || 'admin',
            secretKey: process.env.MINIO_ROOT_PASSWORD || 'password',
        });
    }

    async ensureBucket() {
        try {
            const exists = await this.client.bucketExists(this.bucket);
            if (!exists) {
                await this.client.makeBucket(this.bucket, 'us-east-1');
                console.log(`Bucket ${this.bucket} created`);
            }
        } catch (err) {
            console.error('Error checking bucket:', err);
        }
    }

    async getUploadUrl(objectName: string, expirySeconds: number = 3600): Promise<string> {
        return await this.client.presignedPutObject(this.bucket, objectName, expirySeconds);
    }

    async getDownloadUrl(objectName: string, expirySeconds: number = 3600): Promise<string> {
        return await this.client.presignedGetObject(this.bucket, objectName, expirySeconds);
    }
}
