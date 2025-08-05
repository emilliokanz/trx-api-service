import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ExternalTransactionService } from 'src/externalTransaction/externalTransaction.service';
import { TransactionService } from 'src/transaction/transaction.service';

@Processor('scheduledJobs', { concurrency: 1})
export class SchedulerProcessor extends WorkerHost {
  private readonly logger = new Logger(SchedulerProcessor.name);
  constructor(
    private readonly transactionService: TransactionService, // Inject TransactionService
    private readonly extTransactionService: ExternalTransactionService
  ) {
    super();
  }

  async process(job: Job<any>) {
    this.logger.debug(`Check for new Order Lists`);

    try {
      await this.executeTransaction(job.data);
      this.logger.debug(`Succesfully checked Order List`);
      return { success: true };
    } catch (error) {
      console.log(error)
        this.logger.error(`Failed checking Order List`);
      throw error;
    }
  }

  private async executeTransaction(data: any): Promise<void> {
    // const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // await delay(5000);
    if(process.env.NODE_ENV !== 'dev'){
      await this.transactionService.updateAllTxTStatus()
      await this.transactionService.getItemkuOrderList();
      // await this.extTransactionService.updateAllTxTStatus()
    }
  }
}