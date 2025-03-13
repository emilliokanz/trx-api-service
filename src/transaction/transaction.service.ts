import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class TransactionService {
  constructor(
    @InjectQueue('userTransactions') private readonly transactionQueue: Queue,
  ) {}

  async addTransaction(transactionData: any): Promise<any> {
    const { userId } = transactionData;
    
  
    const job = await this.transactionQueue.add(
      {
        ...transactionData,
        createdAt: new Date(),
      },
      {
        jobId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Unique job ID
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },

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
      message: `Transaction queued for user ${userId}`,
    };
  }

  async getTransactionStatus(jobId: string): Promise<any> {
    console.log(jobId, "job id")
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