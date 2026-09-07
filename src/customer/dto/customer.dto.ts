import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'johndoe', description: 'Username of the customer to create' })
  username: string;
}

export class UpdateCustomerBalanceDto {
  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 500000, description: 'New balance value' })
  balance: number;
}

export class CustomerApiKeyDto {
  @ApiProperty({ example: 'johndoe', description: 'Customer to generate an API key for' })
  username: string;
}

export class GetCustomerByUsernameDto {
  @ApiProperty({ example: 'johndoe' })
  username: string;
}

export class GetCustomersDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number, 1 based' })
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Rows per page' })
  take?: number;
}
