import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOwnerDto {
  @ApiProperty({ example: 'PT Contoh Sejahtera', description: 'Owner name' })
  name: string;
}

export class GetOwnersDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number, 1 based' })
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Rows per page' })
  take?: number;
}

export class GetOwnerByIdDto {
  @ApiProperty({ example: 1, description: 'Owner id' })
  id: number;
}

export class UpdateOwnerBalanceDto {
  @ApiProperty({ example: 1, description: 'Owner id' })
  id: number;

  @ApiProperty({ example: 25000000, description: 'New balance value' })
  balance: number;
}
