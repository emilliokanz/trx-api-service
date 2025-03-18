import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { UserRoles } from 'src/auth/roles.decorator';
import { CustomerService } from './customer.service';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('')
  async createCustomer(@Body() customerData: any) {
    return this.customerService.addUser(customerData.username);
  }
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/update')
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
}
