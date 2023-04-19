export type SimpleResolver<V> = (req: Express.Request, file: Express.Multer.File, callback: (error: any, key?: V) => void) => void;

export type ParamResolver<V> = SimpleResolver<V> | V;

export type FileUploadOptions<O> = {
  [K in keyof O]: ParamResolver<O[K]>;
}