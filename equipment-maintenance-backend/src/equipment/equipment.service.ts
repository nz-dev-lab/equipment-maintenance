// src/equipment/equipment.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipmentDto, EquipmentStatus, EquipmentCondition } from './dto/create-equipment.dto';

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
}