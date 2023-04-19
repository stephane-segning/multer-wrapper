import type { StorageEngine } from 'multer';
import type { Request } from 'express';
import type { Client as MinioClient } from 'minio';
import type { S3 } from 'aws-sdk';
import type { PutObjectRequest, S3 as ClientS3 } from '@aws-sdk/client-s3';
import type { BaseHandler } from './handlers/base-handler';
import type { FileUploadOptions } from './types';
import type { MinioOption } from './handlers/minio-client-storage.handler';

export type S3WrapperEngineOptions = {
  client: MinioClient;
  vendor: 'MinioClient';
  fileOptions?: FileUploadOptions<MinioOption>;
} | {
  client: ClientS3;
  vendor: 'ClientS3';
  fileOptions?: FileUploadOptions<PutObjectRequest>;
} | {
  client: S3;
  vendor: 'S3';
  fileOptions?: FileUploadOptions<S3.Types.PutObjectRequest>;
}

export class WrapperEngine implements StorageEngine {

  private readonly handler: BaseHandler;

  public constructor(options: S3WrapperEngineOptions) {
    switch (options.vendor) {
      case 'MinioClient':
        const { MinioClientStorageHandler } = require('./handlers/minio-client-storage.handler');
        this.handler = new MinioClientStorageHandler(options.client, options.fileOptions);
        break;
      case 'ClientS3':
        const { ClientS3StorageHandler } = require('./handlers/client-s3-storage.handler');
        this.handler = new ClientS3StorageHandler(options.client, options.fileOptions);
        break;
      case 'S3':
        const { S3StorageHandler } = require('./handlers/s3-storage.handler');
        this.handler = new S3StorageHandler(options.client, options.fileOptions);
        break;
    }
  }

  public _handleFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void {
    const sub = this.handler.upload(req, file)
      .subscribe({
        next: (value) => {
          callback(undefined, value);
          // sub.unsubscribe();
        },
        error: err => {
          callback(err);
          // sub.unsubscribe();
        },
      });
  }

  public _removeFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error: (Error | null)) => void,
  ): void {
    const sub = this.handler.remove(req, file)
      .subscribe({
        next: () => {
          callback(null);
          // sub.unsubscribe();
        },
        error: err => {
          callback(err);
          // sub.unsubscribe();
        },
      });
  }

}