import { FileUploadOptions, ParamResolver, SimpleResolver } from '../types';
import { bindCallback, filter, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Request } from 'express';

export function flatResolver<V>(r: ParamResolver<V>): SimpleResolver<V> {
  if (typeof r === 'function') {
    return r as any;
  } else {
    return (res, file, callback) => callback(r);
  }
}

export function resolveParam<V>(req: Request, file: Express.Multer.File, key: ParamResolver<V> | undefined): Observable<V> {
  return of(key)
    .pipe(
      filter(i => !!i),
      map(p => flatResolver(p!)),
      switchMap(p => bindCallback(p)(req, file)),
      map(([err, value]) => {
        if (err || !value) {
          throw err || 'missing value';
        }
        return value;
      }),
    );
}

export function resolveParams<T>(req: Request, file: Express.Multer.File, fileOptions?: FileUploadOptions<T>): Observable<T> {
  const ops = fileOptions || {};
  return forkJoin(
    Object.entries(ops)
      .map(([key, value]) => ({
        [key]: resolveParam(req, file, value),
      }))
      .reduce((previousValue, currentValue) => ({
        ...previousValue,
        ...currentValue,
      }), {}),
  ).pipe(
    // Because I don't know how to keep the code hard typed inside this method.
    map(m => m as any),
  );
}