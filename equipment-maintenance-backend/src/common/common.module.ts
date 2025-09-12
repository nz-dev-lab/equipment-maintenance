import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AuditLoggingMiddleware } from './middleware/audit-logging.middleware';
import { RateLimitingMiddleware } from './middleware/rate-limiting.middleware';
import { RequestLoggingMiddleware } from './middleware/request-logging.middleware';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';
import { PrismaService } from '../prisma/prisma.service';

@Module({
    providers: [
        AuditLoggingMiddleware,
        RateLimitingMiddleware,
        RequestLoggingMiddleware,
        TenantContextMiddleware,
        PrismaService,
    ],
    exports: [
        AuditLoggingMiddleware,
        RateLimitingMiddleware,
        RequestLoggingMiddleware,
        TenantContextMiddleware,
    ],
})
export class CommonModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Apply rate limiting to all routes
        consumer
            .apply(RateLimitingMiddleware)
            .forRoutes('*');

        // Apply request logging to all routes
        consumer
            .apply(RequestLoggingMiddleware)
            .forRoutes('*');

        // Apply tenant context to all routes except auth
        consumer
            .apply(TenantContextMiddleware)
            .exclude('/auth/register-company', '/auth/login', '/auth/invitation/(.*)', '/auth/accept-invitation/(.*)')
            .forRoutes('*');

        // Apply audit logging to authenticated routes
        consumer
            .apply(AuditLoggingMiddleware)
            .exclude('/auth/register-company', '/auth/login', '/auth/invitation/(.*)', '/auth/accept-invitation/(.*)')
            .forRoutes('*');
    }
}