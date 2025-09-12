import {
    IsString,
    IsOptional,
    IsUUID,
    IsEnum,
    IsDateString,
    IsNumber,
    IsPositive,
    MinLength,
    MaxLength
} from 'class-validator';

export enum EquipmentStatus {
    GOOD_TO_GO = 'good_to_go',
    NEEDS_MAINTENANCE = 'needs_maintenance',
    OUT_OF_ORDER = 'out_of_order'
}

export enum EquipmentCondition {
    EXCELLENT = 'excellent',
    GOOD = 'good',
    FAIR = 'fair',
    POOR = 'poor'
}

export class CreateEquipmentDto {
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    name: string;

    @IsOptional()
    @IsUUID()
    equipmentTypeId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    serialNumber?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    model?: string;

    @IsOptional()
    @IsDateString()
    purchaseDate?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    purchasePrice?: number;

    @IsOptional()
    @IsEnum(EquipmentStatus)
    currentStatus?: EquipmentStatus;

    @IsOptional()
    @IsEnum(EquipmentCondition)
    condition?: EquipmentCondition;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    location?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsDateString()
    lastMaintenanceDate?: string;

    @IsOptional()
    @IsDateString()
    nextMaintenanceDue?: string;

    // Photo URLs will be handled separately in file upload feature
    // QR code will be auto-generated
    // Company ID will come from JWT token
    // Created by will come from JWT token
    // Timestamps will be auto-generated
}