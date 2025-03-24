import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CustomerModule } from './customer/customer.module';
import { OwnerModule } from './owner/owner.module';
import { ProductModule } from './product/product.modue';
import { QueueModule } from './queue/queue.module';
import { PrismaModule } from './prisma/prisma.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { FastifyAdapter } from '@bull-board/fastify';


@Module({
  imports: [
    QueueModule,
    CustomerModule,
    OwnerModule,
    ProductModule,
    AuthModule,
    PrismaModule,
    BullBoardModule.forRoot({
      route: '/queues', // Base route for the dashboard
      adapter: FastifyAdapter, // Or FastifyAdapter
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
