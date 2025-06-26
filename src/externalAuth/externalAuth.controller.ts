import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
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

    @UseGuards(AuthGuard)
    @Post('/detail')
    async userDetail(@Req() req: any){
        return await this.extAuthService.getUserDetail(req.headers.authorization)
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

    @UseGuards(AuthGuard)
    @UserRoles([Roles.Admin])
    @Post('/generate-referal')
    async reqReferal(@Req() req: any) {
        const user = await this.extAuthService.getUserDetail(req.headers.authorization)
        return this.extAuthService.generateReferalCode(user.id);
    }

    @Post('/check-referal')
    async checkReferal(@Body() payload: any) {
        return this.extAuthService.checkReferalCode(payload.referal_code);
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.Customer])
    @Post('/assign-admin')
    async assignToAdmin(@Body() payload: any, req: any){
        const user = await this.extAuthService.getUserDetail(req.headers.authorization)
        return this.extAuthService.assignToAdminUser(payload.referal_code, user.id)
    }
}
