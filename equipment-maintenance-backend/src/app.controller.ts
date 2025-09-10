import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service'; // Add this

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService, // Add this
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Add this test endpoint
  @Get('test-db')
  async testDatabase() {
    const companyCount = await this.prisma.company.count();
    return {
      message: 'Database connected!',
      companies: companyCount,
      tables: 'All tables created successfully'
    };
  }
}