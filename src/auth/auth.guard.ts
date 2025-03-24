import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Roles } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      if (!payload) {
        throw new UnauthorizedException();
      }

      const requiredRoles = this.reflector.getAllAndOverride<Roles[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!requiredRoles) {
        return true;
      }
      const { role } = payload;

      request.user = payload;

      return requiredRoles.includes(role);
    } catch(e: any) {
      throw new UnauthorizedException({message: e.message, statusCode: HttpStatus.UNAUTHORIZED});
    }
  }

  private extractTokenFromHeader(
    request: Request & { headers: { authorization?: string } },
  ): string | undefined {
    const token = request.headers.authorization ?? undefined;
    return token
  }
}
