import { Request } from 'express';
import { Observable } from 'rxjs';

export interface BaseHandler {
  upload(req: Request, file: Express.Multer.File): Observable<Partial<Express.Multer.File>>;

  remove(req: Request, file: Express.Multer.File): Observable<void>;
}