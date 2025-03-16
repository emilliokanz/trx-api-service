import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';

@Module({
  imports: [],
  controllers: [OwnerController],
  providers: [OwnerService, PrismaService],
})
export class OwnerModule {}
