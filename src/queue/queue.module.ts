import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { CustomerService } from 'src/customer/customer.service';
import { OwnerService } from 'src/owner/owner.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionController } from '../transaction/transaction.controller';
import { TransactionProcessor } from '../transaction/transaction.processor';
import { TransactionService } from '../transaction/transaction.service';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BalanceHistoryService } from 'src/balanceHistory/balanceHistory.service';
import { SchedulerService } from 'src/scheduler/scheduler.service';
import { SchedulerProcessor } from 'src/scheduler/scheduler.processor';
import { ProductService } from 'src/product/product.service';


@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6380,
        password: 'your_secure_password',
      },
    }),
    BullModule.registerQueue({
      name: 'userTransactions',
      defaultJobOptions: {
        delay: 1000,
        removeOnComplete: false,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({
      name: 'scheduledJobs',
      defaultJobOptions: {
        delay: 1000,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({
      name: 'extTransactions',
      defaultJobOptions: {
        delay: 1000,
        removeOnComplete: false,
        removeOnFail: false,
      },
    }),
    BullBoardModule.forFeature({
      name: 'userTransactions', 
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'extTransactions', 
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'scheduledJobs',
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionProcessor,
    SchedulerService,
    SchedulerProcessor,
    PrismaService,
    CustomerService,
    OwnerService,
    BalanceHistoryService,
    ProductService
  ], exports: [
    BullModule,
    PrismaService, TransactionService, OwnerService, BalanceHistoryService,
     CustomerService
  ]
})
export class QueueModule {}
