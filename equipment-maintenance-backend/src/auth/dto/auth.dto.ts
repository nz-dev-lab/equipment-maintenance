import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class RegisterCompanyDto {
    @IsString()
    companyName: string;

    @IsEmail()
    adminEmail: string;

    @IsString()
    adminFirstName: string;

    @IsString()
    adminLastName: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsOptional()
    @IsString()
    phone?: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class InviteUserDto {
    @IsEmail()
    email: string;

    @IsIn(['manager', 'staff'])
    role: 'manager' | 'staff';

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;
}

export class AcceptInvitationDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsOptional()
    @IsString()
    phone?: string;
}