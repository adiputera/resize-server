import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// Authentication endpoint - POST /auth
// Usage: Send Basic Auth header with clientId:clientSecret
router.post('/auth', async (req: Request, res: Response) => {
    try {
        const authorization = req.headers.authorization;
        if (authorization && authorization.startsWith('Basic ')) {
            const base64Credentials = authorization.split(' ')[1];
            const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
            const [clientId, clientSecret] = credentials.split(':');

            if (clientId && clientSecret) {
                const savedClientSecret = process.env[clientId + '_auth_client'];
                const jwtSecretKey = process.env['jwt_secret_key'];
                const jwtExpiresIn = parseInt(process.env['jwt_expire_time'] || '900');

                if (savedClientSecret && savedClientSecret === clientSecret && jwtSecretKey && jwtExpiresIn) {
                    const token = jwt.sign(
                        {
                            iss: 'resize-server',
                            sub: clientId
                        },
                        jwtSecretKey,
                        {
                            expiresIn: jwtExpiresIn
                        }
                    );

                    return res.status(200).json({
                        'access_token': token,
                        'token_type': 'Bearer',
                        'expiresIn': jwtExpiresIn - 10
                    });
                }
            }
        }
    } catch (error) {
        console.error('Auth error:', error);
    }

    return res.status(400).json({
        error: 'Invalid credential'
    });
});

export default router;
