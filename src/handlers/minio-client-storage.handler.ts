import type { BaseHandler } from './base-handler';
import type { Request } from 'express';
import { from, map, Observable, of, switchMap } from 'rxjs';
import type { Client, ItemBucketMetadata } from 'minio';
import type { Readable as ReadableStream } from 'stream';
import { resolveParams } from '../helpers/string-resolve';
import type { FileUploadOptions } from '../types';

export type MinioOption = {
  bucket: string;
  key: string;
  metaData?: ItemBucketMetadata & {
    ACL?: string;
    'Content-Type'?: string;
    'Content-Disposition'?: string;
    'Content-Language'?: number;
  };
  storageClass?: string;
  serverSideEncryption?: string;
}

export class MinioClientStorageHandler implements BaseHandler {
  constructor(
    private readonly client: Client,
    private readonly fileOptions?: FileUploadOptions<MinioOption>,
  ) {
  }

  public remove(req: Request, file: Express.Multer.File): Observable<void> {
    return of(undefined);
  }

  public upload(req: Request, file: Express.Multer.File): Observable<Partial<Express.Multer.File>> {
    return resolveParams(req, file, this.fileOptions).pipe(
      switchMap((params) => from(this.putObject(params.bucket, params.key, file.stream, params.metaData || {}))
        .pipe(
          map((result) => ({ params, result })),
        )),
      map(({ result, params }) => ({
        size: file.size,
        bucket: params.bucket,
        key: params.key,
        acl: params.metaData?.ACL,
        contentType: params.metaData ? params.metaData['Content-Type'] : undefined,
        contentDisposition: params.metaData ? params.metaData['Content-Disposition'] : undefined,
        storageClass: undefined,
        serverSideEncryption: undefined,
        metadata: params.metaData,
        etag: result.etag,
        versionId: result.versionId,
        filename: file.originalname,
        mimetype: file.mimetype,
      })),
    );
  }

  private putObject = (
    bucketName: string,
    objectName: string,
    stream: ReadableStream | Buffer | string,
    metaData: ItemBucketMetadata,
  ) => this.client.putObject(bucketName, objectName, stream, metaData);
}