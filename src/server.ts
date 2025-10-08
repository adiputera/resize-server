import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import config from './config';
import log from './lib/log';
import RequestSplitter from './lib/requestsplitter';
import { ResizeJob } from './lib/resize';

// Ensure cache directory exists
if (!fs.existsSync(config.cacheDirectory)) {
    fs.mkdirSync(config.cacheDirectory, { recursive: true });
}

const app = express();

// Express 4.x middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../views'));

// Remove X-Powered-By header
app.use((_req: Request, res: Response, next: NextFunction) => {
    res.removeHeader('X-Powered-By');
    next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.send('OK').end();
});

// Help page
app.get('/', (req: Request, res: Response) => {
    const params = {
        layout: false,
        hostname: req.headers.host,
    };
    res.render('help', params);
});

// Main resize endpoint
app.get(RequestSplitter.urlMatch, (req: Request, res: Response) => {
    const now = new Date().getTime();
    const jobStartTime = now;

    try {
        const rs = new RequestSplitter(req.path, req.query as Record<string, string>);
        const options = rs.mapOptions();

        const rj = new ResizeJob(options, (err, file, cached): void => {
            if (err) {
                res.status(typeof err.status === 'number' ? err.status : 500).json(err);
                return;
            }

            if (!file) {
                res.status(500).json({ status: 500, message: 'Resize failed' });
                return;
            }

            const jobEndTime = new Date().getTime();
            const jobDuration = cached ? 0 : jobEndTime - jobStartTime;

            res.setHeader('X-ResizeJobDuration', String(jobDuration));
            res.setHeader('Expires', new Date(now + config.cacheHeader.expires).toUTCString());

            res.sendFile(file, { maxAge: config.cacheHeader.maxAge });
        });

        rj.startResize();
    } catch (error) {
        res.status(400).json({ status: 400, message: 'Invalid request format' });
    }
});

// Start server
log.write('resize server listening on ' + config.appPort);
app.listen(config.appPort);

export default app;
