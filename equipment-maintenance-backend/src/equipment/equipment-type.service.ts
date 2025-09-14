import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEquipmentTypeDto } from './dto/create-equipment-type.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateEquipmentTypeDto } from './dto/update-equipment-type.dto';

@Injectable()
export class EquipmentTypeService {
    constructor(private prisma: PrismaService) {
    }

    // Create a new equipment type
    async createEquipmentType(dto: CreateEquipmentTypeDto, companyId: string) {
        // Check for duplicate equipment type within the same company
        const existingEquipmentType = await this.prisma.equipmentType.findFirst({
            where: {
                name: dto.name,
                companyId: companyId,
                isActive: true,
            },
        });

        if (existingEquipmentType) {
            throw new ConflictException('Equipment type with this name already exists in the company');
        }

        // Create the equipment type
        const equipmentType = await this.prisma.equipmentType.create({
            data: {
                name: dto.name,
                description: dto.description,
                defaultMaintenanceIntervalDays: dto.defaultMaintenanceIntervalDays || 180,
                companyId: companyId,
                isActive: true,
            },
        });

        return equipmentType;
    }

    // Get all equipment types for a company
    async getAllEquipmentTypes(companyId: string) {
        return this.prisma.equipmentType.findMany({
            where: {
                companyId: companyId,
                isActive: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    // Get equipment type by ID
    async getEquipmentTypeById(id: string, companyId: string) {
        return this.prisma.equipmentType.findFirst({
            where: {
                id: id,
                companyId: companyId,
                isActive: true,
            },
        });
    }

    // Update equipment type
    async updateEquipmentType(id: string, dto: UpdateEquipmentTypeDto, companyId: string) {
        // Check if the equipment type exists
        const equipmentType = await this.prisma.equipmentType.findFirst({
            where: {
                id: id,
            },
        });

        if (!equipmentType) {
            throw new ConflictException('Equipment type not found');
        }

        // Update the equipment type
        return this.prisma.equipmentType.update({
            where: {
                id: id,
            },
            data: {
                name: dto.name,
                description: dto.description,
                defaultMaintenanceIntervalDays: dto.defaultMaintenanceIntervalDays,
            },
        });
    }

    // Soft delete equipment type
    async deleteEquipmentType(id: string, companyId: string) {
        //Check if the equipment type exists
        const equipmentCount = await this.prisma.equipment.count({
            where: {
                id: id,
                isActive: true,
            }
        })
        if (equipmentCount > 0) {
            throw new ConflictException(
                `Cannot delete equipment type. ${equipmentCount} equipment items are still using this type.`
            );
        }

        //Soft delete the equipment type
        return this.prisma.equipmentType.update({
            where: {
                id: id,
                companyId: companyId,
            },
            data: {
                isActive: false,
            }
        })
    }
}