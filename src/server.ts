import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import config from './config';
import log from './lib/log';
import authRouter from './routes/auth';
import mediaPOSTRouter from './routes/mediaPOST';
import mediaGETRouter from './routes/mediaGET';
import resizeGETRouter from './routes/resizeGET';
import traditionalRouter from './routes/traditional';

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

// Routes
app.use(authRouter);
app.use(mediaPOSTRouter);
app.use(mediaGETRouter);
app.use(resizeGETRouter);

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

// Traditional resize endpoint
app.use(traditionalRouter);

// Start server
log.write('resize server listening on ' + config.appPort);
app.listen(config.appPort);

export default app;
