import { IsString, IsOptional, MinLength, IsNumber, IsPositive } from 'class-validator';

export class CreateEquipmentTypeDto {
    @IsString()
    @MinLength(1)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    defaultMaintenanceIntervalDays?: number;
}