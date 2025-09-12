import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Add this import
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { EquipmentModule } from './equipment/equipment.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes env variables available everywhere
    }),
    CommonModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    EquipmentModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }