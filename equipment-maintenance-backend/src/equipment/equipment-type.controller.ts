import { Body, Controller, Delete, Get, Post, Put, Request, UseGuards } from '@nestjs/common';
import { EquipmentTypeService } from './equipment-type.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateEquipmentTypeDto } from './dto/create-equipment-type.dto';
import { UpdateEquipmentTypeDto } from './dto/update-equipment-type.dto';

@Controller('equipment-types')
export class EquipmentTypeController {
    constructor(
        private equipmentTypeService: EquipmentTypeService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'manager')
    async create(@Body() dto: CreateEquipmentTypeDto, @Request() req) {
        return this.equipmentTypeService.createEquipmentType(dto, req.user.companyId);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Request() req) {
        return this.equipmentTypeService.getAllEquipmentTypes(req.user.companyId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Request() req) {
        return this.equipmentTypeService.getEquipmentTypeById(req.params.id, req.user.companyId);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'manager')
    async update(@Body() dto: UpdateEquipmentTypeDto, @Request() req) {
        return this.equipmentTypeService.updateEquipmentType(req.params.id, dto, req.user.companyId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'manager')
    async deactivate(@Request() req) {
        return this.equipmentTypeService.deleteEquipmentType(req.params.id, req.user.companyId);
    }
}