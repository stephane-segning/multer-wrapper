import { BaseHandler } from './base-handler';
import { Request } from 'express';
import { bindCallback, map, Observable, of, switchMap } from 'rxjs';
import { FileUploadOptions } from '../types';
import { S3 } from 'aws-sdk';
import { AWSError } from 'aws-sdk/lib/error';
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
    const upload = bindCallback(this.putObject);

    return resolveParams(req, file, this.fileOptions).pipe(
      switchMap((params) => upload(params)
        .pipe(
          map(([err, value]) => {
            if (err) {
              throw err;
            }
            return value;
          }),
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

  private putObject = (params: S3.Types.PutObjectRequest, callback?: (err: AWSError, data: S3.Types.PutObjectOutput) => void) => this.client.putObject;
}