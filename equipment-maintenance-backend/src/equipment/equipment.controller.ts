// src/equipment/equipment.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { EquipmentFilterDto } from './dto/equipment-filter.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';

@Controller('equipment')
export class EquipmentController {
    constructor(private equipmentService: EquipmentService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'manager')
    async create(@Body() dto: CreateEquipmentDto, @Request() req) {
        return this.equipmentService.createEquipment(dto, req.user.companyId, req.user.userId);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Query() filters: EquipmentFilterDto, @Request() req) {
        return this.equipmentService.findAll(filters, req.user.companyId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async findOne(@Param('id') id: string, @Request() req) {
        return this.equipmentService.findOne(id, req.user.companyId);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'manager')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateEquipmentDto,
        @Request() req
    ) {
        return this.equipmentService.update(id, dto, req.user.companyId, req.user.userId);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard)
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateEquipmentStatusDto,
        @Request() req
    ) {
        return this.equipmentService.updateStatus(id, dto, req.user.companyId, req.user.userId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    async remove(@Param('id') id: string, @Request() req) {
        return this.equipmentService.remove(id, req.user.companyId);
    }
}