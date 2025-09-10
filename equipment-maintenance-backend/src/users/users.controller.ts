import {
    Controller,
    Get,
    Put,
    Delete,
    Patch,
    Body,
    Param,
    UseGuards,
    Request
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto, UpdateUserRoleDto } from './dto/user-management.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard) // All routes require authentication
export class UsersController {
    constructor(private usersService: UsersService) { }

    // GET ALL COMPANY USERS (Admin/Manager only)
    @UseGuards(RolesGuard)
    @Roles('admin', 'manager')
    @Get()
    async getCompanyUsers(@Request() req) {
        return this.usersService.getCompanyUsers(req.user.companyId, req.user.role);
    }

    // GET SINGLE USER BY ID
    @Get(':id')
    async getUserById(@Param('id') userId: string, @Request() req) {
        return this.usersService.getUserById(userId, req.user.companyId);
    }

    // UPDATE OWN PROFILE
    @Put('profile')
    async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(req.user.userId, dto);
    }

    // CHANGE OWN PASSWORD
    @Put('change-password')
    async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
        return this.usersService.changePassword(req.user.userId, dto);
    }

    // UPDATE USER ROLE (Admin only)
    @UseGuards(RolesGuard)
    @Roles('admin')
    @Patch(':id/role')
    async updateUserRole(
        @Request() req,
        @Param('id') userId: string,
        @Body() dto: UpdateUserRoleDto
    ) {
        return this.usersService.updateUserRole(req.user.userId, userId, dto.role);
    }

    // DEACTIVATE USER (Admin only)
    @UseGuards(RolesGuard)
    @Roles('admin')
    @Delete(':id')
    async deactivateUser(@Request() req, @Param('id') userId: string) {
        return this.usersService.deactivateUser(req.user.userId, userId);
    }

    // REACTIVATE USER (Admin only)
    @UseGuards(RolesGuard)
    @Roles('admin')
    @Patch(':id/reactivate')
    async reactivateUser(@Request() req, @Param('id') userId: string) {
        return this.usersService.reactivateUser(req.user.userId, userId);
    }
}