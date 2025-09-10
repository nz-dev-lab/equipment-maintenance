// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // Import AuthModule to use guards and decorators
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService], // Export in case other modules need user operations
})
export class UsersModule { }