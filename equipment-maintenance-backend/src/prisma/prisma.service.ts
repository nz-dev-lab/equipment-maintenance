import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            log: ['query', 'info', 'warn', 'error'], // Log SQL queries in development
        });
    }

    async onModuleInit() {
        await this.$connect();
        console.log('✅ Connected to PostgreSQL database');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        console.log('❌ Disconnected from PostgreSQL database');
    }

    // Helper method for soft deletes (optional)
    async softDelete(model: string, id: string) {
        return this[model].update({
            where: { id },
            data: { isActive: false },
        });
    }
}
