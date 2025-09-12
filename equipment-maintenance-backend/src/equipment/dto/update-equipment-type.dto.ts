import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipmentTypeDto } from './create-equipment-type.dto';

export class UpdateEquipmentTypeDto extends PartialType(CreateEquipmentTypeDto) { }