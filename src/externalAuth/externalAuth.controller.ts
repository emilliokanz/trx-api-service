import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ExtenalAuthService } from './externalAuth.service';
import { Roles } from '@prisma/client';
import { UserRoles } from 'src/auth/roles.decorator';
import { AuthGuard } from 'src/auth/auth.guard';


@Controller('ext-auth')
export class ExternalAuthController {
    constructor(private extAuthService: ExtenalAuthService) { }

    @Post('/login')
    async login(@Body() payload: any) {
        return await this.extAuthService.login(payload);
    }

    @Post('/register')
    async register(@Body() payload: any) {
        return await this.extAuthService.signUp(payload);
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.Admin, Roles.SuperAdmin])
    @Post('/api-key')
    async reqApiKey(@Body() payload: any) {
        return this.extAuthService.generateApiKey(payload.username);
    }
}
