import { Router, Request, Response } from 'express';
import config from '../config';
import RequestSplitter from '../lib/requestsplitter';
import { ResizeJob } from '../lib/resize';

const router = Router();

// Traditional resize endpoint
// Format: /{resize}/{output}/{url}
// Example: /c300x300/jpg,90/http://example.com/image.jpg
router.get(RequestSplitter.urlMatch, (req: Request, res: Response) => {
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

export default router;
