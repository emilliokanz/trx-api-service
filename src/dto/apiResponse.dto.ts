import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto {
    @ApiProperty({ example: 'success', description: 'Human readable result message' })
    message: string

    @ApiProperty({
        nullable: true,
        description: 'Endpoint specific payload. `null` when the call failed.',
    })
    data: any

    @ApiPropertyOptional({
        example: '0000',
        description: '`0000` on success, otherwise a code from src/lib/errorCodes.ts',
    })
    errorCode?: string

    constructor(message: string, data: any, errorCode?: string) {
        this.errorCode = errorCode;
        this.message = message;
        this.data = data
    }
}
