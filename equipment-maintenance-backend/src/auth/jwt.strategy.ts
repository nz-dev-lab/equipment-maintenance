import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: JwtStrategy.getJwtSecret(configService),
        });
    }

    private static getJwtSecret(configService: ConfigService): string {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is required');
        }
        return secret;
    }

    async validate(payload: any) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: payload.userId,
                isActive: true,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        subscriptionPlan: true,
                        isActive: true,
                    }
                }
            }
        });

        if (!user || !user.company?.isActive) {
            throw new UnauthorizedException('User or company not found or inactive');
        }

        return {
            userId: user.id,
            companyId: user.companyId,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            company: user.company,
        };
    }
}