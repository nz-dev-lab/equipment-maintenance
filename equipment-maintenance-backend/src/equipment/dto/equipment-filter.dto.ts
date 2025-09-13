import { IsOptional, IsEnum, IsString, IsUUID, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EquipmentStatus, EquipmentCondition } from './create-equipment.dto';

export class EquipmentFilterDto {
    // Filter by equipment status
    @IsOptional()
    @IsEnum(EquipmentStatus)
    status?: EquipmentStatus;

    // Filter by equipment condition
    @IsOptional()
    @IsEnum(EquipmentCondition)
    condition?: EquipmentCondition;

    // Filter by equipment type
    @IsOptional()
    @IsUUID()
    equipmentTypeId?: string;

    // Filter by location
    @IsOptional()
    @IsString()
    location?: string;

    // Search in name, serial number, or model
    @IsOptional()
    @IsString()
    search?: string;

    // Pagination - page number (starts from 1)
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    // Pagination - items per page
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    // Sort field
    @IsOptional()
    @IsIn(['name', 'createdAt', 'updatedAt', 'purchaseDate', 'nextMaintenanceDue'])
    sortBy?: string = 'createdAt';

    // Sort order
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = 'desc';

    // Filter by assigned/unassigned status
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    assigned?: boolean;

    // Filter by maintenance status
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    maintenanceOverdue?: boolean;
}