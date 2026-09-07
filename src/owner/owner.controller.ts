import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { UserRoles } from 'src/auth/roles.decorator';
import { OwnerService } from './owner.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBody, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/dto/apiResponse.dto';
import {
  CreateOwnerDto,
  GetOwnerByIdDto,
  GetOwnersDto,
  UpdateOwnerBalanceDto,
} from './dto/owner.dto';
import { JWT_AUTH } from 'src/swagger/swagger.setup';

@ApiTags('Owner')
@ApiSecurity(JWT_AUTH)
@Controller('owner')
export class OwnerController {
  constructor(private owner: OwnerService) { }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create an owner', description: 'Creates an owner with a zero balance.' })
  @ApiBody({ type: CreateOwnerDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin]) @Post('')
  async createOwner(@Body() payload: any) {
    return await this.owner.createOwner(payload.name);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List owners', description: 'Paginated owner list.' })
  @ApiBody({ type: GetOwnersDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin]) @Post('/get')
  @HttpCode(200)
  async getOwner(@Body() payload: any) {
    return await this.owner.findOwners(payload.page, payload.take);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Single owner', description: 'Looks up one owner by id.' })
  @ApiBody({ type: GetOwnerByIdDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin]) @Post('/get-one')
  @HttpCode(200)
  async getOwnerById(@Body() payload: any) {
    return await this.owner.findOwnerById(payload.id);
  }

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Set an owner balance',
    description: 'Overwrites the balance of the owner identified by `id`.',
  })
  @ApiBody({ type: UpdateOwnerBalanceDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin]) @Post('/update')
  async updateOwnerBalance(@Body() payload: any) {
    return await this.owner.updateOwnerBalance(payload.id, payload.balance);
  }
}
