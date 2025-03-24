import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { UserRoles } from 'src/auth/roles.decorator';
import { CustomerService } from './customer.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('')
  async createCustomer(@Body() customerData: any) {
    return this.customerService.addUser(customerData.username);
  }
  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin])  @Post('/update')
  async updateCustomer(@Body() customerData: any) {
    return this.customerService.updateUserBalance(
      customerData.balance,
      customerData.username,
    );
  }
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/api-key')
  async reqApiKey(@Body() customerData: any) {
    return this.customerService.generateApiKey(customerData.username);
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @HttpCode(200)
  @Post('/get-username')
  async getUserByUsername(@Body() payload: any) {
    return this.customerService.getUserByUsername(payload.username)
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @HttpCode(200)
  @Post('/get')
  async getUsers(@Body() payload: any) {
    return this.customerService.getAllUser(payload.page, payload.take)
  }
}
