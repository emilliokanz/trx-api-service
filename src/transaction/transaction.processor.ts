import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('userTransactions')
export class TransactionProcessor {
  private readonly logger = new Logger(TransactionProcessor.name);

  @Process({ concurrency: 100 })
  async processTransaction(job: Job<any>) {
    this.logger.debug(`Processing transaction for user: ${job.data.ref_id}`);

    try {
      // Perform the actual transaction logic here
      // e.g., database operations, external API calls, etc.
      await this.executeTransaction(job.data);

      this.logger.debug(`Transaction completed for user: ${job.data.ref_id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Transaction failed for user: ${job.data.ref_id}`,
        error.stack,
      );
      throw error;
    }
  }

  private async executeTransaction(data: any): Promise<void> {
    // Simulate transaction processing time
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Implement your actual transaction logic here
    // e.g. update database, call payment processor, etc.
  }
}
