import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty } from "class-validator"

export class PaginationDto{
    @ApiProperty({ example: 1, description: 'Page number, 1 based' })
    @IsNotEmpty()
    page: number
    @ApiProperty({ example: 10, description: 'Rows per page' })
    @IsNotEmpty()
    size: number
}
