import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

@Injectable()
export class RateLimitingMiddleware implements NestMiddleware {
    private requests = new Map<string, RateLimitEntry>();
    private readonly windowMs = 15 * 60 * 1000; // 15 minutes
    private readonly maxRequests = 100; // requests per window

    use(req: Request, res: Response, next: NextFunction) {
        const identifier = this.getIdentifier(req);
        const now = Date.now();

        // Clean old entries
        this.cleanup(now);

        const entry = this.requests.get(identifier);

        if (!entry) {
            // First request from this identifier
            this.requests.set(identifier, {
                count: 1,
                resetTime: now + this.windowMs
            });
            this.setHeaders(res, 1, now + this.windowMs);
            return next();
        }

        if (now > entry.resetTime) {
            // Window has reset
            entry.count = 1;
            entry.resetTime = now + this.windowMs;
            this.setHeaders(res, 1, entry.resetTime);
            return next();
        }

        // Within window
        entry.count++;

        if (entry.count > this.maxRequests) {
            this.setHeaders(res, entry.count, entry.resetTime);
            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: 'Too many requests',
                    error: 'Rate limit exceeded',
                },
                HttpStatus.TOO_MANY_REQUESTS
            );
        }

        this.setHeaders(res, entry.count, entry.resetTime);
        next();
    }

    private getIdentifier(req: Request): string {
        // Use user ID if authenticated, otherwise IP
        const user = req.user as any;
        return user?.userId || req.ip || 'unknown';
    }

    private setHeaders(res: Response, current: number, resetTime: number) {
        res.set({
            'X-RateLimit-Limit': this.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, this.maxRequests - current).toString(),
            'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
        });
    }

    private cleanup(now: number) {
        for (const [key, entry] of this.requests.entries()) {
            if (now > entry.resetTime) {
                this.requests.delete(key);
            }
        }
    }
}