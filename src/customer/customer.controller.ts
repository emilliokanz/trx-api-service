import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Roles } from '@prisma/client';
import { UserRoles } from 'src/auth/roles.decorator';
import { CustomerService } from './customer.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBody, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/dto/apiResponse.dto';
import {
  CreateCustomerDto,
  CustomerApiKeyDto,
  GetCustomerByUsernameDto,
  GetCustomersDto,
  UpdateCustomerBalanceDto,
} from './dto/customer.dto';
import { JWT_AUTH } from 'src/swagger/swagger.setup';

@ApiTags('Customer')
@ApiSecurity(JWT_AUTH)
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Create an internal customer',
    description: 'Creates a customer record with a zero balance.',
  })
  @ApiBody({ type: CreateCustomerDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('')
  async createCustomer(@Body() customerData: any) {
    return this.customerService.addUser(customerData.username);
  }
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Set a customer balance',
    description: 'Overwrites the balance of the customer named in the body.',
  })
  @ApiBody({ type: UpdateCustomerBalanceDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])  @Post('/update')
  async updateCustomer(@Body() customerData: any) {
    return this.customerService.updateUserBalance(
      customerData.balance,
      customerData.username,
    );
  }
  @ApiOperation({
    summary: 'Generate an internal customer API key',
    description:
      'Returns a fresh API key for the customer. NOTE: this route carries @UserRoles but no ' +
      '@UseGuards(AuthGuard), so no token is checked today and the role restriction is not enforced.',
  })
  @ApiBody({ type: CustomerApiKeyDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @Post('/api-key')
  async reqApiKey(@Body() customerData: any) {
    return this.customerService.generateApiKey(customerData.username);
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @ApiOperation({
    summary: 'Look up a customer by username',
    description: 'Returns the customer record, including its current balance.',
  })
  @ApiBody({ type: GetCustomerByUsernameDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @HttpCode(200)
  @Post('/get-username')
  async getUserByUsername(@Body() payload: any) {
    return this.customerService.getUserByUsername(payload.username)
  }

  @UseGuards(AuthGuard)
  @UserRoles([Roles.Admin, Roles.SuperAdmin])
  @ApiOperation({
    summary: 'List customers',
    description: 'Paginated customer list.',
  })
  @ApiBody({ type: GetCustomersDto })
  @ApiOkResponse({ type: ApiResponseDto })
  @HttpCode(200)
  @Post('/get')
  async getUsers(@Body() payload: any) {
    return this.customerService.getAllUser(payload.page, payload.take)
  }
}
