import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
    ApiBody,
    ApiOperation,
    ApiSecurity,
    ApiTags,
    ApiUnauthorizedResponse,
    ApiOkResponse,
    ApiCreatedResponse,
} from '@nestjs/swagger';
import { ExternalAuthService } from './externalAuth.service';
import { Roles } from '@prisma/client';
import { UserRoles } from 'src/auth/roles.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiResponseDto } from 'src/dto/apiResponse.dto';
import { CurrentUser } from 'src/utils/decorators/currenct-user.decorator';
import {
    AdminCustomerListDto,
    AssignAdminDto,
    CheckReferalDto,
    GenerateApiKeyDto,
    GenerateReferalDto,
    LoginDto,
    LoginResponseDto,
    SignUpDto,
} from './dto/auth.dto';
import { JWT_AUTH } from 'src/swagger/swagger.setup';


@ApiTags('Auth')
@Controller('/api/v1/auth')
export class ExternalAuthController {
    constructor(private extAuthService: ExternalAuthService) { }

    @ApiOperation({
        summary: 'Log in and obtain a JWT',
        description:
            'Returns `data.access_token`. Send that token back in the `authorization` header ' +
            'exactly as received -- the guard verifies the raw header value, so do NOT add a ' +
            '"Bearer " prefix. Wrong credentials answer 200 with `errorCode` `1000`.',
    })
    @ApiBody({ type: LoginDto })
    @ApiCreatedResponse({ type: LoginResponseDto })
    @Post('/login')
    async login(@Body() payload: any) {
        return await this.extAuthService.login(payload);
    }

    @ApiOperation({
        summary: 'Current user detail',
        description: 'Decodes the JWT in the `authorization` header and returns its claims.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiCreatedResponse({ type: ApiResponseDto })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
    @UseGuards(AuthGuard)
    @Post('/detail')
    async userDetail(@Req() req: any) {
        const user = await this.extAuthService.getUserDetail(req.headers.authorization)
        return new ApiResponseDto('success', user, "0000")
    }

    @ApiOperation({
        summary: 'Register a customer account',
        description:
            'Creates a `Customer` user. When `referal_code` is supplied the customer is also ' +
            'attached to the owning admin. Duplicate usernames answer with `errorCode` `1003`.',
    })
    @ApiBody({ type: SignUpDto })
    @ApiCreatedResponse({ type: ApiResponseDto })
    @Post('/register')
    async register(@Body() payload: any) {
        return await this.extAuthService.signUp(payload);
    }

    @ApiOperation({
        summary: 'Generate an API key for the calling admin',
        description:
            'Returns a freshly generated API key in `data.apiKey`. It is only shown once -- the ' +
            'stored copy is encrypted. Use it to sign request bodies for the `x-sign` header.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiCreatedResponse({ type: ApiResponseDto })
    @UseGuards(AuthGuard)
    @UserRoles([Roles.Admin, Roles.SuperAdmin])
    @Post('/admin/api-key')
    async reqApiKeyAdmin(@CurrentUser() user: any
    ) {
        return this.extAuthService.generateApiKey(user);
    }

    @ApiOperation({
        summary: 'Generate an API key for another user (SuperAdmin)',
        description: 'Same as `/admin/api-key`, but the target user is named in the body.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiBody({ type: GenerateApiKeyDto })
    @ApiCreatedResponse({ type: ApiResponseDto })
    @UseGuards(AuthGuard)
    @UserRoles([Roles.SuperAdmin])
    @Post('/api-key')
    async reqApiKey(@Body() payload: any, @CurrentUser() user: any
    ) {
        console.log(user)
        return this.extAuthService.generateApiKey(user, payload.username);
    }

    @ApiOperation({
        summary: 'Generate a referral code',
        description: 'Admin only. Creates the referral code customers use at registration.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiBody({ type: GenerateReferalDto })
    @ApiCreatedResponse({ type: ApiResponseDto })
    @UseGuards(AuthGuard)
    @UserRoles([Roles.Admin])
    @Post('/generate-referal')
    async reqReferal(@Body() payload: any, @Req() req: any) {
        const user = await this.extAuthService.getUserDetail(req.headers.authorization)
        return this.extAuthService.generateReferalCode(user.id, payload.referal_name);
    }

    @ApiOperation({
        summary: 'Check a referral code',
        description: 'Public. Resolves a referral code to its owning admin. `1005` when unknown.',
    })
    @ApiBody({ type: CheckReferalDto })
    @ApiCreatedResponse({ type: ApiResponseDto })
    @Post('/check-referal')
    async checkReferal(@Body() payload: any) {
        return this.extAuthService.checkReferalName(payload.referal_code);
    }

    @ApiOperation({
        summary: 'Attach the current customer to an admin',
        description: 'Customer only. `1006` when the customer is already assigned.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiBody({ type: AssignAdminDto })
    @ApiCreatedResponse({ type: ApiResponseDto })
    @UseGuards(AuthGuard)
    @UserRoles([Roles.Customer])
    @Post('/assign-admin')
    async assignToAdmin(@Body() payload: any, @Req() req: any) {
        const user = await this.extAuthService.getUserDetail(req.headers.authorization)
        return this.extAuthService.assignAdminCustomer(payload.referal_code, user.id)
    }

    @ApiOperation({
        summary: 'List the customers of the calling admin',
        description: 'Paginated. `name` narrows the result set.',
    })
    @ApiSecurity(JWT_AUTH)
    @ApiBody({ type: AdminCustomerListDto })
    @ApiCreatedResponse({ type: ApiResponseDto })
    @UseGuards(AuthGuard)
    @UserRoles([Roles.Admin])
    @Post('/customer-list')
    async getAdminCustomers(@Body() payload: any, @Req() req: any) {
        const user = await this.extAuthService.getUserDetail(req.headers.authorization)
        return this.extAuthService.getAdminCustomerList(payload.page, payload.size, payload.name, user.id)
    }
}
