import { Body, Controller, Post } from '@nestjs/common';
import { CustomerService } from './customer.service';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('')
  async createCustomer(@Body() customerData: any) {
    return this.customerService.addUser(customerData.username);
  }

  @Post('/update')
  async updateCustomer(@Body() customerData: any) {
    return this.customerService.updateUserBalance(
      customerData.balance,
      customerData.username,
    );
  }

  @Post('/api-key')
  async reqApiKey(@Body() customerData: any) {
    return this.customerService.generateApiKey(customerData.username);
  }
}
