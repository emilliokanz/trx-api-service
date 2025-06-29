import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ExternalAuthService } from './externalAuth.service';
import { Roles } from '@prisma/client';
import { UserRoles } from 'src/auth/roles.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiResponseDto } from 'src/dto/apiResponse.dto';


@Controller('ext-auth')
export class ExternalAuthController {
    constructor(private extAuthService: ExternalAuthService) { }

    @Post('/login')
    async login(@Body() payload: any) {
        return await this.extAuthService.login(payload);
    }

    @UseGuards(AuthGuard)
    @Post('/detail')
    async userDetail(@Req() req: any) {
        const user = await this.extAuthService.getUserDetail(req.headers.authorization)
        return new ApiResponseDto('success', user, "0000")
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
    async assignToAdmin(@Body() payload: any, @Req() req: any) {
        const user = await this.extAuthService.getUserDetail(req.headers.authorization)
        return this.extAuthService.assignAdminCustomer(payload.referal_code, user.id)
    }
}
