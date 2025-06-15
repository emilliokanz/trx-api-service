export class ApiResponseDto {
    message: string
    data: any
    errorCode?: string

    constructor(message: string, data: any, errorCode?: string) {
        this.errorCode = errorCode;
        this.message = message;
        this.data = data
    }
}