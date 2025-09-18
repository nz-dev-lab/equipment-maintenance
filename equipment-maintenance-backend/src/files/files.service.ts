import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadEquipmentPhotoDto } from './dto/upload-file.dto';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
    private readonly uploadDir = 'uploads';
    private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
    private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    constructor(private prisma: PrismaService) {
        // Ensure upload directory exists
        this.ensureUploadDirectoryExists();
    }

    private ensureUploadDirectoryExists() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async uploadEquipmentPhoto(
        file: Express.Multer.File,
        equipmentId: string,
        companyId: string,
        uploadedBy: string,
        dto: UploadEquipmentPhotoDto
    ) {
        // Validate file
        this.validateFile(file);

        // Verify equipment exists and belongs to company
        const equipment = await this.prisma.equipment.findFirst({
            where: {
                id: equipmentId,
                companyId: companyId,
                isActive: true
            }
        });

        if (!equipment) {
            throw new BadRequestException('Equipment not found');
        }

        // If setting as primary, remove primary flag from other photos
        if (dto.isPrimary) {
            await this.prisma.equipmentPhoto.updateMany({
                where: {
                    equipmentId: equipmentId,
                    isPrimary: true
                },
                data: { isPrimary: false }
            });
        }

        // Check if this is the first photo (auto-set as primary)
        const existingPhotosCount = await this.prisma.equipmentPhoto.count({
            where: { equipmentId }
        });

        const shouldBePrimary = dto.isPrimary || existingPhotosCount === 0;

        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const uniqueFilename = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(this.uploadDir, uniqueFilename);

        // Save file to disk
        fs.writeFileSync(filePath, file.buffer);

        // Create database record
        const photoRecord = await this.prisma.equipmentPhoto.create({
            data: {
                equipmentId,
                companyId,
                fileUrl: `/files/${uniqueFilename}`,
                filename: file.originalname,
                fileSizeBytes: file.size,
                mimeType: file.mimetype,
                isPrimary: shouldBePrimary,
                photoType: dto.photoType || 'general',
                description: dto.description,
                uploadedBy,
            },
        });

        return photoRecord;
    }

    async getEquipmentPhotos(equipmentId: string, companyId: string) {
        return this.prisma.equipmentPhoto.findMany({
            where: {
                equipmentId,
                companyId
            },
            orderBy: [
                { isPrimary: 'desc' }, // Primary photo first
                { uploadedAt: 'asc' }  // Then by upload order
            ],
            include: {
                uploader: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
    }

    async setPrimaryPhoto(photoId: string, companyId: string) {
        const photo = await this.prisma.equipmentPhoto.findFirst({
            where: {
                id: photoId,
                companyId: companyId
            }
        });

        if (!photo) {
            throw new BadRequestException('Photo not found');
        }

        // Remove primary flag from other photos of this equipment
        await this.prisma.equipmentPhoto.updateMany({
            where: {
                equipmentId: photo.equipmentId,
                isPrimary: true
            },
            data: { isPrimary: false }
        });

        // Set this photo as primary
        await this.prisma.equipmentPhoto.update({
            where: { id: photoId },
            data: { isPrimary: true }
        });

        return { message: 'Primary photo updated successfully' };
    }

    async getFile(filename: string) {
        const filePath = path.join(this.uploadDir, filename);

        if (!fs.existsSync(filePath)) {
            throw new BadRequestException('File not found');
        }

        return {
            path: filePath,
            buffer: fs.readFileSync(filePath)
        };
    }

    async deletePhoto(photoId: string, companyId: string) {
        const photo = await this.prisma.equipmentPhoto.findFirst({
            where: {
                id: photoId,
                companyId: companyId
            }
        });

        if (!photo) {
            throw new BadRequestException('Photo not found');
        }

        // Don't allow deletion of primary photo if it's the only photo
        if (photo.isPrimary) {
            const otherPhotos = await this.prisma.equipmentPhoto.count({
                where: {
                    equipmentId: photo.equipmentId,
                    id: { not: photoId }
                }
            });

            if (otherPhotos === 0) {
                throw new BadRequestException('Cannot delete the only photo. Equipment must have at least one photo.');
            } else {
                throw new BadRequestException('Cannot delete primary photo. Set another photo as primary first.');
            }
        }

        // Delete file from disk
        const filename = path.basename(photo.fileUrl);
        const filePath = path.join(this.uploadDir, filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete database record
        await this.prisma.equipmentPhoto.delete({
            where: { id: photoId }
        });

        return { message: 'Photo deleted successfully' };
    }

    private validateFile(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        if (file.size > this.maxFileSize) {
            throw new BadRequestException('File size too large. Maximum 5MB allowed.');
        }

        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Invalid file type. Only JPG, PNG, and WEBP allowed.');
        }
    }
}