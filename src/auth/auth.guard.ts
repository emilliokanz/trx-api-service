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
import { ExternalAuthService } from 'src/externalAuth/externalAuth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest();
  const token = this.extractTokenFromHeader(request);
  const username = this.extractUsernamFromHeader(request);
  const signature = this.extractSignatureFromHeader(request);

  // Require either token OR (username + signature)
  if (!(token || (username && signature))) {
    throw new UnauthorizedException('Missing token or username/signature');
  }

  try {
    let payload: any = null;

    if (token) {
      // 🔑 Validate JWT
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      if (!payload) {
        throw new UnauthorizedException('Invalid token');
      }
      request.user = payload;
    } else if (username && signature) {
      request.username = username;
      request.signature = signature;

      request.httpRequestBody = { ...request.body };

    }

    // 🔑 Check role-based access (only if JWT is used)
    if (payload) {
      const requiredRoles = this.reflector.getAllAndOverride<Roles[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredRoles && !requiredRoles.includes(payload.role)) {
        throw new UnauthorizedException('Insufficient role');
      }
    }

    return true;
  } catch (e: any) {
    throw new UnauthorizedException({
      message: e.message,
      statusCode: HttpStatus.UNAUTHORIZED,
    });
  }
}


  private extractTokenFromHeader(
    request: Request & { headers: { authorization?: string } },
  ): string | undefined {
    const token = request.headers.authorization ?? undefined;
    return token
  }

   private extractUsernamFromHeader(
    request: Request & { headers: { authorization?: string } },
  ): string | undefined {
    const token = request.headers["x-username"] ?? undefined;
    return token
  }

  private extractSignatureFromHeader(
    request: Request & { headers: { authorization?: string } },
  ): string | undefined {
    const token = request.headers["x-sign"] ?? undefined;
    return token
  }
}
