import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { PrismaService } from "src/prisma/prisma.service";
import { TransactionService } from "src/transaction/transaction.service";

@Injectable()
export class SchedulerService implements OnModuleInit{
    private readonly logger = new Logger(SchedulerService.name);
    constructor(
            @InjectQueue('scheduledJobs') private readonly schedulerQueue: Queue,
    ){}

    async onModuleInit() {
        await this.schedulerQueue.obliterate({ force: true }); // 💀 Deletes all jobs!
        this.logger.debug('Running Scheduler')
        await this.scheduleCheckOrder()
    }


    async scheduleCheckOrder(){
        const jobExist = await this.schedulerQueue.getJob('recurring-order-check');

        if (jobExist) {
          return `Recurring order check already`;
        }
        await this.schedulerQueue.add(
            'check-orders',
            {},
            {
              repeat: {
                every: 60000, //every 1 minute
              },
              jobId: 'recurring-order-check',
            },
        );
    }

}