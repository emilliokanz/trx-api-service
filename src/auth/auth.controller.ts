import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

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
