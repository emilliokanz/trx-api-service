import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ExternalAuthService } from './externalAuth.service';
import { Roles } from '@prisma/client';
import { UserRoles } from 'src/auth/roles.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiResponseDto } from 'src/dto/apiResponse.dto';
import { CurrentUser } from 'src/utils/decorators/currenct-user.decorator';


@Controller('/api/v1/auth')
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
    @Post('/admin/api-key')
    async reqApiKeyAdmin(@CurrentUser() user: any
    ) {
        return this.extAuthService.generateApiKey(user);
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.SuperAdmin])
    @Post('/api-key')
    async reqApiKey(@Body() payload: any, @CurrentUser() user: any
    ) {
        console.log(user)
        return this.extAuthService.generateApiKey(user, payload.username);
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.Admin])
    @Post('/generate-referal')
    async reqReferal(@Body() payload: any, @Req() req: any) {
        const user = await this.extAuthService.getUserDetail(req.headers.authorization)
        return this.extAuthService.generateReferalCode(user.id, payload.referal_name);
    }

    @Post('/check-referal')
    async checkReferal(@Body() payload: any) {
        return this.extAuthService.checkReferalName(payload.referal_code);
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.Customer])
    @Post('/assign-admin')
    async assignToAdmin(@Body() payload: any, @Req() req: any) {
        const user = await this.extAuthService.getUserDetail(req.headers.authorization)
        return this.extAuthService.assignAdminCustomer(payload.referal_code, user.id)
    }

    @UseGuards(AuthGuard)
    @UserRoles([Roles.Admin])
    @Post('/customer-list')
    async getAdminCustomers(@Body() payload: any, @Req() req: any) {
        const user = await this.extAuthService.getUserDetail(req.headers.authorization)
        return this.extAuthService.getAdminCustomerList(payload.page, payload.size, payload.name, user.id)
    }
}
