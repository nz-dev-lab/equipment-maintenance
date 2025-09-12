import { Module } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { EquipmentController } from './equipment.controller';
import { PrismaService } from '../prisma/prisma.service';


@Module({
  providers: [EquipmentService],
  controllers: [EquipmentController]
})
export class EquipmentModule { }
