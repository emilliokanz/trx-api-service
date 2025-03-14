import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class TransactionService {
  constructor(
    @InjectQueue('userTransactions') private readonly transactionQueue: Queue,
  ) {}

  async addTransaction(transactionData: any): Promise<any> {
    const { ref_id } = transactionData;

    const jobExist = await this.transactionQueue.getJob(ref_id);

    if (jobExist) {
      return {
        id: ref_id,
        status: 'failed',
        message: `Transaction exist for ref id ${ref_id}`,
      };
    }

    const job = await this.transactionQueue.add(
      {
        ...transactionData,
        createdAt: new Date(),
      },
      {
        jobId: `${ref_id}`, // Unique job ID
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        delay: 2000,
        limiter: {
          max: 1,
          duration: 10000,
          bounceBack: true,
        },
      },
    );

    return {
      id: job.id,
      status: 'queued',
      message: `Transaction queued for ref id ${ref_id}`,
    };
  }

  async getTransactionStatus(jobId: string): Promise<any> {
    console.log(jobId, 'job id');
    const job = await this.transactionQueue.getJob(jobId);

    if (!job) {
      return { status: 'not_found' };
    }

    const state = await job.getState();
    return {
      id: job.id,
      status: state,
      data: job.data,
    };
  }
}
