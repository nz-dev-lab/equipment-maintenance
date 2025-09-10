import { IsString, IsOptional, MinLength, IsIn, IsUrl } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsUrl()
    profilePhotoUrl?: string;
}

export class ChangePasswordDto {
    @IsString()
    currentPassword: string;

    @IsString()
    @MinLength(8)
    newPassword: string;
}

export class UpdateUserRoleDto {
    @IsIn(['admin', 'manager', 'staff'])
    role: 'admin' | 'manager' | 'staff';
}