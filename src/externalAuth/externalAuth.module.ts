import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExternalAuthController } from './externalAuth.controller';
import { ExternalAuthService } from './externalAuth.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [ExternalAuthService, PrismaService],
  controllers: [ExternalAuthController],
  exports: [ExternalAuthService],
})
export class ExternalAuthModule {}
