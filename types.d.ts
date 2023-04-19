export global {
  declare module Express {
    export namespace Multer {
      interface File {
        size: number;
        bucket?: string;
        key?: string;
        acl?: string;
        contentType?: string;
        contentDisposition?: string;
        storageClass?: string;
        serverSideEncryption?: string;
        metadata?: Record<string, any>;
        etag?: string;
        filename?: string;
        mimetype?: string;
      }
    }
  }
}