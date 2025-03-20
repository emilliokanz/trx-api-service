import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { UserRoles } from 'src/auth/roles.decorator';
import { OwnerService } from './owner.service';

@Controller('owner')
export class OwnerController {
  constructor(private owner: OwnerService) {}

  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('')
  async createOwner(@Body() payload: any) {
    return await this.owner.createOwner(payload.name);
  }

  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/get')
  @HttpCode(200)
  async getOwner(@Body() payload: any) {
    return await this.owner.findOwners(payload.page, payload.take);
  }

  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/get-one')
  @HttpCode(200)
  async getOwnerById(@Body() payload: any) {
    return await this.owner.findOwnerById(payload.id);
  }

  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/update')
  async updateOwnerBalance(@Body() payload: any) {
    return await this.owner.updateOwnerBalance(payload.id, payload.balance);
  }
}
