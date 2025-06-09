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
import { BalanceHistoryModule } from './balanceHistory/balanceHistory.module';
import { ExternalTransactionModule } from './externalTransaction/externalTransaction.module';


@Module({
  imports: [
    QueueModule,
    CustomerModule,
    OwnerModule,
    ProductModule,
    AuthModule,
    PrismaModule,
    BalanceHistoryModule,
    BullBoardModule.forRoot({
      route: '/queues', // Base route for the dashboard
      adapter: FastifyAdapter, // Or FastifyAdapter
    }),
    ExternalTransactionModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
