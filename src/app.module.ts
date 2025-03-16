import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerModule } from './customer/customer.module';
import { OwnerModule } from './owner/owner.module';
import { ProductModule } from './product/product.modue';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [QueueModule, CustomerModule, OwnerModule, ProductModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
