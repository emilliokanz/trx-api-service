import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExternalAuthController } from './externalAuth.controller';
import { ExtenalAuthService } from './externalAuth.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [ExtenalAuthService, PrismaService],
  controllers: [ExternalAuthController],
  exports: [ExtenalAuthService],
})
export class AuthModule {}
