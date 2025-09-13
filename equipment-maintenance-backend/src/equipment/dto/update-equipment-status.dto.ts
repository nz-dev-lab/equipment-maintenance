import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EquipmentStatus } from './create-equipment.dto';

export class UpdateEquipmentStatusDto {
    // Required: New status for the equipment
    @IsEnum(EquipmentStatus)
    status: EquipmentStatus;

    // Optional: Reason or notes for the status change
    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;

    // Optional: Location update (often status changes come with location changes)
    @IsOptional()
    @IsString()
    @MaxLength(255)
    location?: string;
}