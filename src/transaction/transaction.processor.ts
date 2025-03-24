import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TransactionService } from './transaction.service';

@Processor('userTransactions', { concurrency: 1})
export class TransactionProcessor extends WorkerHost {
  private readonly logger = new Logger(TransactionProcessor.name);
  constructor(
    private readonly transactionService: TransactionService, // Inject TransactionService
  ) {
    super();
  }

  async process(job: Job<any>) {
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
    // const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // await delay(5000);
    await this.transactionService.requestTransaction(data);
  }
}