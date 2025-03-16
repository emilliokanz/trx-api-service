import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { CustomerService } from 'src/customer/customer.service';
import { OwnerService } from 'src/owner/owner.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionController } from '../transaction/transaction.controller';
import { TransactionProcessor } from '../transaction/transaction.processor';
import { TransactionService } from '../transaction/transaction.service';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
        password: 'your_secure_password',
      },
    }),
    BullModule.registerQueue({
      name: 'userTransactions',
      // Setting this option prevents the queue from processing multiple jobs at once
      defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false,
      },
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
