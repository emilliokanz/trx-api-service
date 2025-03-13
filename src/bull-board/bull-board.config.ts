import { ExpressAdapter } from '@bull-board/express';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { createBullBoard } from '@bull-board/api';
import { INestApplication } from '@nestjs/common';
import { Queue } from 'bull';

export const setupBullBoard = (app: INestApplication, queues: Queue[]) => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: queues.map(queue => new BullAdapter(queue)),
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());
};