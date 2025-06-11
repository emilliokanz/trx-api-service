export class ApiResponseDto {
    errorCode: string
    message: string

    constructor(errorCode: string, message: string) {
        this.errorCode = errorCode;
        this.message = message;
    }
}