import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerModule } from './customer/customer.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [QueueModule, CustomerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
