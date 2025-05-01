import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerProcessor } from './scheduler.processor';
import { QueueModule } from '../queue/queue.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { OwnerService } from 'src/owner/owner.service';
import { BalanceHistoryService } from 'src/balanceHistory/balanceHistory.service';
import { CustomerService } from 'src/customer/customer.service';

@Module({
  imports: [QueueModule], // Import QueueModule which provides BullMQ
  providers: [SchedulerService, SchedulerProcessor],
})
export class SchedulerModule {}