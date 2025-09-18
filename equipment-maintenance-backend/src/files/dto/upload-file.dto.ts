import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class UploadEquipmentPhotoDto {
    @IsOptional()
    @IsBoolean()
    isPrimary?: boolean = false;

    @IsOptional()
    @IsIn(['general', 'primary', 'maintenance', 'issue'])
    photoType?: string = 'general';

    @IsOptional()
    @IsString()
    description?: string;
}