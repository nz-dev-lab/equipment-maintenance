import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    // 1. COMPANY ADMIN REGISTRATION (First user creates company)
    async registerCompany(data: {
        companyName: string;
        adminEmail: string;
        adminFirstName: string;
        adminLastName: string;
        password: string;
        phone?: string;
    }) {
        // Check if email already exists
        const existingUser = await this.prisma.user.findFirst({
            where: { email: data.adminEmail }
        });

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Create company and admin user in transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Create company
            const company = await tx.company.create({
                data: {
                    name: data.companyName,
                    email: data.adminEmail,
                    phone: data.phone,
                }
            });

            // Create admin user
            const admin = await tx.user.create({
                data: {
                    companyId: company.id,
                    email: data.adminEmail,
                    passwordHash: hashedPassword,
                    firstName: data.adminFirstName,
                    lastName: data.adminLastName,
                    role: 'admin',
                    emailVerifiedAt: new Date(), // Auto-verify admin
                }
            });

            // Create default company settings
            await tx.companySettings.create({
                data: {
                    companyId: company.id,
                }
            });

            return { company, admin };
        });

        // Generate JWT token
        const token = this.generateJwt({
            userId: result.admin.id,
            companyId: result.company.id,
            role: 'admin',
            email: result.admin.email,
        });

        return {
            token,
            user: this.sanitizeUser(result.admin),
            company: result.company,
        };
    }

    // 2. LOGIN (Any user)
    async login(email: string, password: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                email,
                isActive: true,
            },
            include: {
                company: true,
            }
        });

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        const token = this.generateJwt({
            userId: user.id,
            companyId: user.companyId,
            role: user.role,
            email: user.email,
        });

        return {
            token,
            user: this.sanitizeUser(user),
            company: user.company,
        };
    }

    // 3. INVITE USER (Admin/Manager only)
    async inviteUser(inviterId: string, data: {
        email: string;
        role: 'manager' | 'staff';
        firstName?: string;
        lastName?: string;
    }) {
        const inviter = await this.prisma.user.findUnique({
            where: { id: inviterId },
            include: { company: true }
        });

        if (!inviter || !['admin', 'manager'].includes(inviter.role)) {
            throw new UnauthorizedException('Only admins and managers can invite users');
        }

        // Check if user already exists in this company
        const existingUser = await this.prisma.user.findFirst({
            where: {
                email: data.email,
                companyId: inviter.companyId,
            }
        });

        if (existingUser) {
            throw new ConflictException('User already exists in this company');
        }

        // Check if invitation already sent
        const existingInvitation = await this.prisma.userInvitation.findFirst({
            where: {
                email: data.email,
                companyId: inviter.companyId,
                acceptedAt: null,
                expiresAt: { gte: new Date() }
            }
        });

        if (existingInvitation) {
            throw new ConflictException('Invitation already sent to this email');
        }

        // Create invitation
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to accept

        const invitation = await this.prisma.userInvitation.create({
            data: {
                companyId: inviter.companyId,
                email: data.email,
                role: data.role,
                invitedBy: inviter.id,
                token,
                expiresAt,
            },
            include: {
                company: true,
                inviter: true,
            }
        });

        // TODO: Send email with invitation link
        // await this.sendInvitationEmail(invitation);

        return {
            message: 'Invitation sent successfully',
            invitation: {
                email: invitation.email,
                role: invitation.role,
                expiresAt: invitation.expiresAt,
                // Don't return the token for security
            }
        };
    }

    // 4. ACCEPT INVITATION
    async acceptInvitation(token: string, data: {
        firstName: string;
        lastName: string;
        password: string;
        phone?: string;
    }) {
        const invitation = await this.prisma.userInvitation.findUnique({
            where: { token },
            include: { company: true }
        });

        if (!invitation) {
            throw new NotFoundException('Invalid invitation link');
        }

        if (invitation.acceptedAt) {
            throw new ConflictException('Invitation already accepted');
        }

        if (invitation.expiresAt < new Date()) {
            throw new ConflictException('Invitation has expired');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Create user and mark invitation as accepted
        const result = await this.prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    companyId: invitation.companyId,
                    email: invitation.email,
                    passwordHash: hashedPassword,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    role: invitation.role,
                    emailVerifiedAt: new Date(),
                }
            });

            // Mark invitation as accepted
            await tx.userInvitation.update({
                where: { id: invitation.id },
                data: { acceptedAt: new Date() }
            });

            return user;
        });

        const jwtToken = this.generateJwt({
            userId: result.id,
            companyId: result.companyId,
            role: result.role,
            email: result.email,
        });

        return {
            token: jwtToken,
            user: this.sanitizeUser(result),
            company: invitation.company,
        };
    }

    // 5. GET INVITATION DETAILS (for invitation page)
    async getInvitationDetails(token: string) {
        const invitation = await this.prisma.userInvitation.findUnique({
            where: { token },
            include: {
                company: true,
                inviter: {
                    select: { firstName: true, lastName: true, email: true }
                }
            }
        });

        if (!invitation) {
            throw new NotFoundException('Invalid invitation link');
        }

        if (invitation.acceptedAt) {
            throw new ConflictException('Invitation already accepted');
        }

        if (invitation.expiresAt < new Date()) {
            throw new ConflictException('Invitation has expired');
        }

        return {
            email: invitation.email,
            role: invitation.role,
            company: {
                name: invitation.company.name,
            },
            inviter: invitation.inviter,
            expiresAt: invitation.expiresAt,
        };
    }

    // Helper Methods
    private generateJwt(payload: {
        userId: string;
        companyId: string;
        role: string;
        email: string;
    }) {
        return this.jwtService.sign(payload, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        });
    }

    private sanitizeUser(user: any) {
        const { passwordHash, ...sanitizedUser } = user;
        return sanitizedUser;
    }

    // TODO: Email service
    // private async sendInvitationEmail(invitation: any) {
    //   const inviteLink = `${process.env.FRONTEND_URL}/invite/${invitation.token}`;
    //   // Send email with invite link
    // }
}