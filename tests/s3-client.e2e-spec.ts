import { WrapperEngine } from '../src';
import { IntegrationHelpers } from './helpers/Integration-helpers';
import { Application } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as http from 'http';
import * as path from 'path';
import { S3 } from 'aws-sdk';
import request = require('supertest');

describe('S3 Upload', () => {
  let app: Application;
  let server: http.Server;
  let wrapperEngine: WrapperEngine;

  beforeAll(async () => {
    wrapperEngine = new WrapperEngine({
      client: new S3({}),
      vendor: 'S3',
      fileOptions: {
        ACL: (req, file, callback) => {
          callback(null, 'public-read');
        },
        Bucket: 'test',
        Key: (req, file, callback) => {
          callback(null, new Date().getTime() + file.filename);
        },
        Metadata: (req, file, callback) => {
          callback(null, {});
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
    const filePath = path.resolve(__dirname, './samples/sample-1-pexels.jpg');

    await request(app)
      .post('/single')
      .set('Accept', 'application/json')
      .attach('file', filePath)
      .expect((res) => {
        const { file } = JSON.parse(res.text);
        if (!('size' in file)) {
          throw new Error('Missing attribute [size] in file response');
        }
        if ('transformations' in file) {
          throw new Error('Wrong attribute [transformations] in response file');
        }
      })
      .expect(StatusCodes.CREATED);
  });

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