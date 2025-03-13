import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TransactionProcessor } from '../transaction/transaction.processor';
import { TransactionService } from '../transaction/transaction.service';
import { TransactionController } from '../transaction/transaction.controller';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
        password:'your_secure_password',
      },
    }),
    BullModule.registerQueue({
      name: 'userTransactions',
      // Setting this option prevents the queue from processing multiple jobs at once
      defaultJobOptions: {
        removeOnComplete: 3600,
        removeOnFail: false,
      },
    }),
  ],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionProcessor],
})
export class QueueModule {}
