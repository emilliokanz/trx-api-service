import { ApiPropertyOptional } from "@nestjs/swagger"

export class Pagination {
    @ApiPropertyOptional({ example: 1, description: 'Page number, 1 based' })
    page: number
    @ApiPropertyOptional({ example: 10, description: 'Rows per page' })
    size: number
}
