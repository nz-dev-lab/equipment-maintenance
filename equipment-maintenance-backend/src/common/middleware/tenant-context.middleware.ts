import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request interface
declare global {
    namespace Express {
        interface Request {
            companyId?: string;
            userRole?: string;
            isAdmin?: boolean;
            isManager?: boolean;
            isStaff?: boolean;
        }
    }
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Add tenant context to request for easy access
        if (req.user) {
            const user = req.user as any;

            req.companyId = user.companyId;
            req.userRole = user.role;
            req.isAdmin = user.role === 'admin';
            req.isManager = user.role === 'manager';
            req.isStaff = user.role === 'staff';
        }

        next();
    }
}