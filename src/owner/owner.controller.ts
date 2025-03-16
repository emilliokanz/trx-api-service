import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { OwnerService } from './owner.service';

@Controller('owner')
export class OwnerController {
  constructor(private owner: OwnerService) {}

  @Post('')
  async createOwner(@Body() payload: any) {
    return await this.owner.createOwner(payload.name);
  }

  @Post('/get')
  @HttpCode(200)
  async getOwner(@Body() payload: any) {
    return await this.owner.findOwners(payload.page, payload.take);
  }

  @Post('/get-one')
  @HttpCode(200)
  async getOwnerById(@Body() payload: any) {
    return await this.owner.findOwnerById(payload.id);
  }

  @Post('/update')
  async updateOwnerBalance(@Body() payload: any) {
    return await this.owner.updateOwnerBalance(payload.id, payload.balance);
  }
}
