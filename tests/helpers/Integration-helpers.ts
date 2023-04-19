import express = require('express');
import multer = require('multer');
import {StatusCodes} from 'http-status-codes';
import {WrapperEngine} from "../../src";

export class IntegrationHelpers {
    public static async getApp(wrapperStorage: WrapperEngine) {
        const upload = multer({
            storage: wrapperStorage,
        });

        const app = express();

        app.post('/single', upload.single('file'), (req, res, next) => {
            res.status(StatusCodes.CREATED).json({file: req.file});
        });

        const server = await app.listen();

        return {server, app};
    }
}