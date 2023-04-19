import { WrapperEngine } from '../src';
import { IntegrationHelpers } from './helpers/Integration-helpers';
import { Application } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as http from 'http';
import * as path from 'path';
import { Client } from 'minio';
import request = require('supertest');
import * as crypto from 'crypto';
import {contentType} from "mime-types";

describe('Minio upload', () => {
  let app: Application;
  let server: http.Server;
  let wrapperEngine: WrapperEngine;

  beforeAll(async () => {
    wrapperEngine = new WrapperEngine({
      client: new Client({
        endPoint: process.env.MINIO_HOST!,
        port: Number(process.env.MINIO_PORT),
        pathStyle: true,
        accessKey: process.env.MINIO_ROOT_USER!,
        secretKey: process.env.MINIO_ROOT_PASSWORD!,
        useSSL: process.env.MINIO_USE_SSL === 'true'
      }),
      vendor: 'MinioClient',
      fileOptions: {
        bucket: process.env.MINIO_BUCKET!,
        key: (req, file, cb) => {
          crypto.randomBytes(16, (err, raw) => {
            const ranHex = err ? 'undefined' : raw.toString("hex");
            cb(err, ranHex + '-' + file.originalname.replace(/ /ig, '_'));
          });
        },
        metaData: (req, file, callback) => {
          const newContentType = contentType(file.mimetype) || contentType(file.originalname) || file.mimetype;

          callback(null, {
            "Cache-Control": 'public,immutable,max-age=31536000',
            "Content-Type": newContentType,
            ACL: "public-read",
          });
        },
      },
    });

    const tmp = await IntegrationHelpers.getApp(wrapperEngine);
    app = tmp.app;
    server = tmp.server;
  });

  afterAll(() => {
    server.close();
  });

  it('upload single file', async () => {
    const filePath = path.resolve(__dirname, './samples/sample-2-pexels.jpg');

    await request(app)
      .post('/single')
      .set('Accept', 'application/json')
      .attach('file', filePath)
      .expect((res) => {
        const { file } = JSON.parse(res.text);
        if (!('originalname' in file)) {
          throw new Error('Missing attribute [originalname] in file response');
        }
        if (!('key' in file)) {
          throw new Error('Wrong attribute [key] in response file');
        }
      })
      .expect(StatusCodes.CREATED);
  }, 60_000);

  it('upload no file', async () => {
    await request(app)
      .post('/single')
      .set('Accept', 'application/json')
      .expect((res) => {
        const result = JSON.parse(res.text);
        if ('file' in result) {
          throw new Error('Wrong attribute [file] in response');
        }
      })
      .expect(StatusCodes.CREATED);
  });

  it('basic type', async () => {
    expect(wrapperEngine).toBeInstanceOf(WrapperEngine);
    expect(wrapperEngine._handleFile).toBeDefined();
    expect(wrapperEngine._removeFile).toBeDefined();
  });
});