import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterCompanyDto, LoginDto, InviteUserDto, AcceptInvitationDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register-company')
    async registerCompany(@Body() dto: RegisterCompanyDto) {
        return this.authService.registerCompany(dto);
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto.email, dto.password);
    }

    @UseGuards(JwtAuthGuard)
    @Post('invite')
    async inviteUser(@Request() req, @Body() dto: InviteUserDto) {
        return this.authService.inviteUser(req.user.userId, dto);
    }

    @Get('invitation/:token')
    async getInvitationDetails(@Param('token') token: string) {
        return this.authService.getInvitationDetails(token);
    }

    @Post('accept-invitation/:token')
    async acceptInvitation(@Param('token') token: string, @Body() dto: AcceptInvitationDto) {
        return this.authService.acceptInvitation(token, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getCurrentUser(@Request() req) {
        return { user: req.user };
    }
}