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


@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
        password: 'your_secure_password',
      },
    }),
    BullModule.registerQueue({
      name: 'userTransactions',
      // Setting this option prevents the queue from processing multiple jobs at once
      defaultJobOptions: {
        delay: 1000,
        removeOnComplete: false,
        removeOnFail: false,
      },
    }),
    BullBoardModule.forFeature({
      name: 'userTransactions', // Register the queue with Bull Board
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionProcessor,
    PrismaService,
    CustomerService,
    OwnerService,
  ],
})
export class QueueModule {}
