import { Body, Controller, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AuthService } from './auth.service';

// Deliberately left out of the Swagger spec: JWTs are issued by
// ExternalAuthController (POST /api/v1/auth/login).
@ApiExcludeController()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  async login(@Body() payload: any) {
    return await this.authService.login(payload);
  }

  @Post('/register')
  async register(@Body() payload: any) {
    return await this.authService.signUp(payload);
  }
}
