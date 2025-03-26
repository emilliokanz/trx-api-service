import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { UserRoles } from 'src/auth/roles.decorator';
import { OwnerService } from './owner.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('owner')
export class OwnerController {
  constructor(private owner: OwnerService) { }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin]) @Post('')
  async createOwner(@Body() payload: any) {
    return await this.owner.createOwner(payload.name);
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin]) @Post('/get')
  @HttpCode(200)
  async getOwner(@Body() payload: any) {
    return await this.owner.findOwners(payload.page, payload.take);
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin]) @Post('/get-one')
  @HttpCode(200)
  async getOwnerById(@Body() payload: any) {
    return await this.owner.findOwnerById(payload.id);
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin]) @Post('/update')
  async updateOwnerBalance(@Body() payload: any) {
    return await this.owner.updateOwnerBalance(payload.id, payload.balance);
  }
}
