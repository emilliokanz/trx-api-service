import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ExternalTransactionService } from './externalTransaction.service';

@Processor('extTransactions', { concurrency: 5})
export class ExternalTransactionProcessor extends WorkerHost {
  private readonly logger = new Logger(ExternalTransactionProcessor.name);
  constructor(
    private readonly extTransactionService: ExternalTransactionService, // Inject TransactionService
  ) {
    super();
  }

  async process(job: Job<any>) {
    this.logger.debug(`[JOB] Processing EXT transaction for ref id: ${job.data.ref_id}`);
    console.debug('[JOB] EXT transaction details to be processed: ', job.data);

    try {
      await this.executeTransaction(job.data);
      this.logger.debug(`[JOB] EXT Transaction completed for ref id: ${job.data.ref_id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `[JOB] EXT transaction failed for ref id: ${job.data.ref_id}`,
        error.stack,
      );
      throw error;
    }
  }

  private async executeTransaction(data: any): Promise<void> {
    // const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // await delay(5000);
    await this.extTransactionService.processTransaction(data.customer_no, data.code, data.ref_id, data.batch_id, data.profit, data.supplierType, data.productDetail, data.role, data.user_id);

    // customer_no: x.customer_no,
    // code: x.code,
    // batch_id: batch.batch_id
  }
}