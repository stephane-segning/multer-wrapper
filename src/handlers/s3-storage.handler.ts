import type { BaseHandler } from './base-handler';
import type { Request } from 'express';
import { from, map, Observable, of, switchMap } from 'rxjs';
import type { FileUploadOptions } from '../types';
import { S3 } from 'aws-sdk';
import { resolveParams } from '../helpers/string-resolve';

export class S3StorageHandler implements BaseHandler {
  constructor(
    private readonly client: S3,
    private readonly fileOptions?: FileUploadOptions<S3.Types.PutObjectRequest>,
  ) {
  }

  public remove(req: Request, file: Express.Multer.File): Observable<void> {
    return of(undefined);
  }

  public upload(req: Request, file: Express.Multer.File): Observable<Partial<Express.Multer.File>> {
    return resolveParams(req, file, this.fileOptions).pipe(
      switchMap((params) => from(this.putObject(params))
        .pipe(
          map((result) => ({ params, result })),
        )),
      map(({ result, params }) => ({
        size: file.size,
        bucket: params.Bucket,
        key: params.Key,
        acl: params.ACL,
        contentType: params.ContentType,
        contentDisposition: params.ContentDisposition,
        storageClass: params.StorageClass,
        serverSideEncryption: params.ServerSideEncryption,
        metadata: params.Metadata,
        etag: result.ETag,
        versionId: result.VersionId,
        filename: file.originalname,
        mimetype: file.mimetype,
      })),
    );
  }

  private putObject = (params: S3.Types.PutObjectRequest) => this.client.putObject(params).promise();
}