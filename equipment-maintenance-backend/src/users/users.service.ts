import { Injectable, UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto, ChangePasswordDto } from './dto/user-management.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    // 1. GET ALL COMPANY USERS (Admin/Manager only)
    async getCompanyUsers(companyId: string, userRole: string) {
        // Only admin and managers can see all users
        if (!['admin', 'manager'].includes(userRole)) {
            throw new UnauthorizedException('Insufficient permissions to view users');
        }

        const users = await this.prisma.user.findMany({
            where: {
                companyId,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                lastLoginAt: true,
                createdAt: true,
                profilePhotoUrl: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return {
            users,
            total: users.length,
        };
    }

    // 2. GET SINGLE USER (Same company only)
    async getUserById(userId: string, requestingUserCompanyId: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                id: userId,
                companyId: requestingUserCompanyId,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                lastLoginAt: true,
                createdAt: true,
                profilePhotoUrl: true,
                emailVerifiedAt: true,
            }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return { user };
    }

    // 3. UPDATE USER PROFILE
    async updateProfile(userId: string, data: UpdateProfileDto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...data,
                updatedAt: new Date(),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                profilePhotoUrl: true,
            }
        });

        return {
            user,
            message: 'Profile updated successfully'
        };
    }

    // 4. CHANGE PASSWORD
    async changePassword(userId: string, data: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(data.currentPassword, user.passwordHash);
        if (!isValidPassword) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(data.newPassword, 12);

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: hashedPassword,
                updatedAt: new Date(),
            }
        });

        return { message: 'Password changed successfully' };
    }

    // 5. UPDATE USER ROLE (Admin only)
    async updateUserRole(adminId: string, userId: string, newRole: 'admin' | 'manager' | 'staff') {
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId }
        });

        if (!admin || admin.role !== 'admin') {
            throw new UnauthorizedException('Only admins can change user roles');
        }

        if (adminId === userId) {
            throw new ConflictException('Cannot change your own role');
        }

        const user = await this.prisma.user.update({
            where: {
                id: userId,
                companyId: admin.companyId, // Ensure same company
                isActive: true,
            },
            data: {
                role: newRole,
                updatedAt: new Date(),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
            }
        });

        return {
            user,
            message: `User role updated to ${newRole} successfully`
        };
    }

    // 6. DEACTIVATE USER (Admin only)
    async deactivateUser(adminId: string, userId: string) {
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId }
        });

        if (!admin || admin.role !== 'admin') {
            throw new UnauthorizedException('Only admins can deactivate users');
        }

        if (adminId === userId) {
            throw new ConflictException('Cannot deactivate your own account');
        }

        const user = await this.prisma.user.update({
            where: {
                id: userId,
                companyId: admin.companyId,
            },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
            }
        });

        return {
            user,
            message: 'User deactivated successfully'
        };
    }

    // 7. REACTIVATE USER (Admin only)
    async reactivateUser(adminId: string, userId: string) {
        const admin = await this.prisma.user.findUnique({
            where: { id: adminId }
        });

        if (!admin || admin.role !== 'admin') {
            throw new UnauthorizedException('Only admins can reactivate users');
        }

        const user = await this.prisma.user.update({
            where: {
                id: userId,
                companyId: admin.companyId,
            },
            data: {
                isActive: true,
                updatedAt: new Date(),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
            }
        });

        return {
            user,
            message: 'User reactivated successfully'
        };
    }
}