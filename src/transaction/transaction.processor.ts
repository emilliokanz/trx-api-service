import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TransactionService } from './transaction.service';

@Processor('userTransactions')
export class TransactionProcessor {
  private readonly logger = new Logger(TransactionProcessor.name);
  constructor(
    private readonly transactionHistory: TransactionService, // Inject your service
  ) {}

  @Process()
  async processTransaction(job: Job<any>) {
    this.logger.debug(`Processing transaction for ref id: ${job.data.ref_id}`);
    console.log('Transaction details to be processed: ', job.data);

    try {
      await this.executeTransaction(job.data);
      this.logger.debug(`Transaction completed for ref id: ${job.data.ref_id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Transaction failed for ref id: ${job.data.ref_id}`,
        error.stack,
      );
      throw error;
    }
  }

  private async executeTransaction(data: any): Promise<void> {
    const response = await this.transactionHistory.requestTransaction(data);
  }
}
