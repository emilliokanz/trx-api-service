import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Roles } from '@prisma/client';

export class LoginDto {
  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'S3cretPassw0rd', format: 'password' })
  password: string;
}

export class LoginResultDto {
  @ApiProperty({
    description:
      'JWT to send back in the `authorization` header, verbatim (no "Bearer " prefix).',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJqb2huZG9lIn0.sig',
  })
  access_token: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'success' })
  message: string;

  @ApiProperty({ type: LoginResultDto, nullable: true })
  data: LoginResultDto | null;

  @ApiProperty({ example: '0000', description: '`1000` when the credentials are wrong' })
  errorCode: string;
}

export class SignUpDto {
  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'S3cretPassw0rd', format: 'password' })
  password: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: '628123456789' })
  phone_number?: string;

  @ApiPropertyOptional({
    description: 'Referral code of the admin this customer should be attached to.',
    example: '2f6b3f7a-4d1c-4b2e-9f0a-7c1d2e3f4a5b',
  })
  referal_code?: string;
}

export class UserDetailDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ enum: Roles, example: Roles.Customer })
  role: Roles;

  @ApiPropertyOptional({
    description:
      'Customer: whether the account is attached to an admin. Admin: whether a referral code exists.',
    example: true,
  })
  referal?: boolean;
}

export class GenerateApiKeyDto {
  @ApiPropertyOptional({
    description:
      'SuperAdmin only: username to generate the key for. Omit to generate it for the caller.',
    example: 'johndoe',
  })
  username?: string;
}

export class ApiKeyResultDto {
  @ApiProperty({
    description: 'Plain API key. Only returned once -- it is stored encrypted.',
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  })
  apiKey: string;
}

export class GenerateReferalDto {
  @ApiProperty({ example: 'reseller-jakarta', description: 'Display name of the referral' })
  referal_name: string;
}

export class CheckReferalDto {
  @ApiProperty({ example: '2f6b3f7a-4d1c-4b2e-9f0a-7c1d2e3f4a5b' })
  referal_code: string;
}

export class AssignAdminDto {
  @ApiProperty({
    description: 'Referral code of the admin the current customer should be assigned to.',
    example: '2f6b3f7a-4d1c-4b2e-9f0a-7c1d2e3f4a5b',
  })
  referal_code: string;
}

export class AdminCustomerListDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  size: number;

  @ApiPropertyOptional({ description: 'Filter by customer name', example: 'john' })
  name?: string;
}
