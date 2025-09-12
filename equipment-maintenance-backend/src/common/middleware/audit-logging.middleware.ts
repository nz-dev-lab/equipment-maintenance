import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLoggingMiddleware implements NestMiddleware {
    constructor(private prisma: PrismaService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();

        // Skip audit for certain routes
        const skipRoutes = ['/auth/me', '/users/profile'];
        const shouldSkip = skipRoutes.some(route => req.path.includes(route)) && req.method === 'GET';

        if (shouldSkip) {
            return next();
        }

        // Capture original send method
        const originalSend = res.send;
        let responseBody: any;

        res.send = function (body) {
            responseBody = body;
            return originalSend.call(this, body);
        };

        res.on('finish', async () => {
            try {
                const duration = Date.now() - start;
                const user = req.user as any;

                // Only log if user is authenticated and action is significant
                if (user && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
                    await this.prisma.auditLog.create({
                        data: {
                            companyId: user.companyId,
                            userId: user.userId,
                            action: this.getActionFromRequest(req),
                            entityType: this.getEntityTypeFromPath(req.path),
                            entityId: this.extractEntityId(req),
                            oldValues: req.method === 'PUT' || req.method === 'PATCH' ? req.body : null,
                            newValues: res.statusCode < 400 ? responseBody : null,
                            ipAddress: req.ip || req.connection.remoteAddress,
                            userAgent: req.get('User-Agent'),
                        }
                    });
                }
            } catch (error) {
                console.error('Audit logging failed:', error);
            }
        });

        next();
    }

    private getActionFromRequest(req: Request): string {
        const method = req.method.toLowerCase();
        const path = req.path;

        if (method === 'post') return 'created';
        if (method === 'put' || method === 'patch') return 'updated';
        if (method === 'delete') return 'deleted';
        if (path.includes('login')) return 'login';
        if (path.includes('logout')) return 'logout';

        return method;
    }

    private getEntityTypeFromPath(path: string): string {
        if (path.includes('/users')) return 'user';
        if (path.includes('/equipment')) return 'equipment';
        if (path.includes('/events')) return 'event';
        if (path.includes('/teams')) return 'team';
        if (path.includes('/maintenance')) return 'maintenance';

        return 'unknown';
    }

    private extractEntityId(req: Request): string | null {
        const pathParts = req.path.split('/');
        // Look for UUID pattern in path
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        for (const part of pathParts) {
            if (uuidRegex.test(part)) {
                return part;
            }
        }

        return null;
    }
}