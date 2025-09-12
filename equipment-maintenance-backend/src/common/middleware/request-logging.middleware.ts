import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        const { method, originalUrl, ip } = req;
        const userAgent = req.get('User-Agent') || '';

        // Log request
        this.logger.log(`${method} ${originalUrl} - ${ip} - ${userAgent}`);

        res.on('finish', () => {
            const { statusCode } = res;
            const duration = Date.now() - start;
            const user = req.user as any;

            const logLevel = statusCode >= 400 ? 'error' : 'log';
            const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms - ${ip}${user ? ` - User: ${user.email}` : ''}`;

            this.logger[logLevel](message);
        });

        next();
    }
}