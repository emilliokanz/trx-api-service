import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Queue } from 'bull';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { setupBullBoard } from './bull-board/bull-board.config';

dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const transactionQueue = app.get<Queue>('BullQueue_userTransactions');

  setupBullBoard(app, [transactionQueue]);

  await app.listen(3000);
}
bootstrap();
