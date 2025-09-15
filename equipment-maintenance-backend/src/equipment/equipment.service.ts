// src/equipment/equipment.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto, EquipmentStatus, EquipmentCondition } from './dto/create-equipment.dto';
import { EquipmentFilterDto } from './dto/equipment-filter.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';

@Injectable()
export class EquipmentService {
    constructor(private prisma: PrismaService) { }

    async createEquipment(dto: CreateEquipmentDto, companyId: string, userId: string) {
        // Validate equipment type is required
        if (!dto.equipmentTypeId) {
            throw new ConflictException('Equipment type is required');
        }

        // Check if equipment type exists and belongs to the same company
        const equipmentType = await this.prisma.equipmentType.findFirst({
            where: {
                id: dto.equipmentTypeId,
                companyId: companyId,
                isActive: true,
            },
        });

        if (!equipmentType) {
            throw new NotFoundException('Invalid equipment type or equipment type not found');
        }

        // Check for duplicate serial number within the same company (if provided)
        if (dto.serialNumber) {
            const existingEquipment = await this.prisma.equipment.findFirst({
                where: {
                    serialNumber: dto.serialNumber,
                    companyId: companyId,
                    isActive: true,
                },
            });

            if (existingEquipment) {
                throw new ConflictException('Equipment with this serial number already exists in the company');
            }
        }

        // Generate unique QR code
        const qrCode = `EQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create the equipment
        const equipment = await this.prisma.equipment.create({
            data: {
                name: dto.name,
                equipmentTypeId: dto.equipmentTypeId,
                serialNumber: dto.serialNumber,
                model: dto.model,
                purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
                purchasePrice: dto.purchasePrice || null,
                currentStatus: dto.currentStatus || EquipmentStatus.GOOD_TO_GO,
                condition: dto.condition || EquipmentCondition.EXCELLENT,
                location: dto.location || 'Warehouse',
                notes: dto.notes,
                lastMaintenanceDate: dto.lastMaintenanceDate ? new Date(dto.lastMaintenanceDate) : null,
                nextMaintenanceDue: dto.nextMaintenanceDue ? new Date(dto.nextMaintenanceDue) : null,
                qrCode: qrCode,
                companyId: companyId,
                createdBy: userId,
                isActive: true,
                photoUrls: [], // Initialize as empty array
            },
            include: {
                equipmentType: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        // Log initial status in equipment status history
        await this.prisma.equipmentStatusHistory.create({
            data: {
                equipmentId: equipment.id,
                oldStatus: null,
                newStatus: equipment.currentStatus,
                oldLocation: null,
                newLocation: equipment.location,
                changedBy: userId,
                notes: 'Equipment created',
                photoUrls: [],
                changedAt: new Date(),
            },
        });

        return equipment;
    }

    async findAll(filters: EquipmentFilterDto, companyId: string) {
        // Build where clause starting with required filters
        const where: any = {
            companyId: companyId, // Explicitly set companyId first
            isActive: true,
        };

        // Add optional filters only if they exist
        if (filters.status) {
            where.currentStatus = filters.status;
        }

        if (filters.condition) {
            where.condition = filters.condition;
        }

        if (filters.equipmentTypeId) {
            where.equipmentTypeId = filters.equipmentTypeId;
        }

        if (filters.location) {
            where.location = {
                contains: filters.location,
                mode: 'insensitive'
            };
        }

        // Handle search separately to avoid object spreading issues
        if (filters.search && typeof filters.search === 'string' && filters.search.trim()) {
            where.OR = [
                { name: { contains: filters.search.trim(), mode: 'insensitive' } },
                { serialNumber: { contains: filters.search.trim(), mode: 'insensitive' } },
                { model: { contains: filters.search.trim(), mode: 'insensitive' } }
            ];
        }

        // Calculate pagination
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        // Build sort object
        const orderBy: any = {};
        orderBy[filters.sortBy || 'createdAt'] = filters.sortOrder || 'desc';

        // Debug log to see what's in the where clause
        console.log('Where clause:', JSON.stringify(where, null, 2));

        // Execute query
        const [equipment, total] = await Promise.all([
            this.prisma.equipment.findMany({
                where,
                include: {
                    equipmentType: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                    creator: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.equipment.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data: equipment,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    // Get equipment by ID
    async findOne(id: string, companyId: string) {
        const equipment = await this.prisma.equipment.findFirst({
            where: {
                id: id,
                companyId: companyId,
                isActive: true,
            },
            include: {
                equipmentType: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        defaultMaintenanceIntervalDays: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                assignments: {
                    where: {
                        returnedAt: null, // Only current assignments
                    },
                    include: {
                        event: {
                            select: {
                                id: true,
                                name: true,
                                startDatetime: true,
                                endDatetime: true,
                            },
                        },
                        team: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        assigner: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
                statusHistory: {
                    orderBy: {
                        changedAt: 'desc',
                    },
                    take: 5, // Last 5 status changes
                    include: {
                        changer: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!equipment) {
            throw new NotFoundException('Equipment not found');
        }

        return equipment;
    }

    //Update an equipment
    async update(id: string, dto: UpdateEquipmentDto, companyId: string, userId: string) {
        // 1. Verify equipment exists and belongs to company
        const existingEquipment = await this.prisma.equipment.findFirst({
            where: {
                id: id,
                companyId: companyId,
                isActive: true,
            },
        });

        if (!existingEquipment) {
            throw new NotFoundException('Equipment not found');
        }

        // 2. Validate equipment type if being changed
        if (dto.equipmentTypeId && dto.equipmentTypeId !== existingEquipment.equipmentTypeId) {
            const equipmentType = await this.prisma.equipmentType.findFirst({
                where: {
                    id: dto.equipmentTypeId,
                    companyId: companyId,
                    isActive: true,
                },
            });

            if (!equipmentType) {
                throw new NotFoundException('Equipment type not found');
            }
        }

        // 3. Check serial number uniqueness if being changed
        if (dto.serialNumber && dto.serialNumber !== existingEquipment.serialNumber) {
            const duplicateSerial = await this.prisma.equipment.findFirst({
                where: {
                    serialNumber: dto.serialNumber,
                    companyId: companyId,
                    isActive: true,
                    NOT: {
                        id: id, // Exclude current equipment
                    },
                },
            });

            if (duplicateSerial) {
                throw new ConflictException('Equipment with this serial number already exists');
            }
        }

        // 4. Prepare update data
        const updateData: any = {
            ...dto,
            updatedAt: new Date(),
        };

        // Handle date fields
        if (dto.purchaseDate) {
            updateData.purchaseDate = new Date(dto.purchaseDate);
        }
        if (dto.lastMaintenanceDate) {
            updateData.lastMaintenanceDate = new Date(dto.lastMaintenanceDate);
        }
        if (dto.nextMaintenanceDue) {
            updateData.nextMaintenanceDue = new Date(dto.nextMaintenanceDue);
        }

        // 5. Update equipment
        const updatedEquipment = await this.prisma.equipment.update({
            where: { id },
            data: updateData,
            include: {
                equipmentType: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        // 6. Track status change if status was updated
        if (dto.currentStatus && dto.currentStatus !== existingEquipment.currentStatus) {
            await this.prisma.equipmentStatusHistory.create({
                data: {
                    equipmentId: id,
                    oldStatus: existingEquipment.currentStatus,
                    newStatus: dto.currentStatus,
                    oldLocation: existingEquipment.location,
                    newLocation: dto.location || existingEquipment.location,
                    changedBy: userId,
                    notes: 'Equipment updated',
                    photoUrls: [],
                    changedAt: new Date(),
                },
            });
        }

        return updatedEquipment;
    }

    //Update Equipment Status
    async updateStatus(id: string, dto: UpdateEquipmentStatusDto, companyId: string, userId: string) {
        // 1. Verify equipment exists and belongs to company
        const existingEquipment = await this.prisma.equipment.findFirst({
            where: {
                id: id,
                companyId: companyId,
                isActive: true,
            },
        });

        if (!existingEquipment) {
            throw new NotFoundException('Equipment not found');
        }

        // 2. Check if status is actually changing
        if (dto.status === existingEquipment.currentStatus) {
            throw new ConflictException('Equipment already has this status');
        }

        // 3. Prepare update data
        const updateData: any = {
            currentStatus: dto.status,
            updatedAt: new Date(),
        };

        // Update location if provided
        if (dto.location) {
            updateData.location = dto.location;
        }

        // 4. Update equipment status
        const updatedEquipment = await this.prisma.equipment.update({
            where: { id },
            data: updateData,
            include: {
                equipmentType: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
            },
        });

        // 5. Create status history entry
        await this.prisma.equipmentStatusHistory.create({
            data: {
                equipmentId: id,
                oldStatus: existingEquipment.currentStatus,
                newStatus: dto.status,
                oldLocation: existingEquipment.location,
                newLocation: dto.location || existingEquipment.location,
                changedBy: userId,
                notes: dto.notes || 'Status updated',
                photoUrls: [],
                changedAt: new Date(),
            },
        });

        return updatedEquipment;
    }
}