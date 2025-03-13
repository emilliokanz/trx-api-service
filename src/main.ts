import { NestFactory } from '@nestjs/core';
import {AppModule} from './app.module';
import * as dotenv from 'dotenv';
import { setupBullBoard } from './bull-board/bull-board.config';
import { Queue } from 'bull';

dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const transactionQueue = app.get<Queue>('BullQueue_userTransactions');
  
  setupBullBoard(app, [transactionQueue]);
  
  await app.listen(3000);
}
bootstrap();