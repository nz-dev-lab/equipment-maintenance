import { Module } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { EquipmentController } from './equipment.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EquipmentTypeService } from './equipment-type.service';
import { EquipmentTypeController } from './equipment-type.controller';
import { AuthModule } from 'src/auth/auth.module';


@Module({
  imports: [AuthModule],
  providers: [EquipmentService, EquipmentTypeService],
  controllers: [EquipmentController, EquipmentTypeController]
})
export class EquipmentModule { }
