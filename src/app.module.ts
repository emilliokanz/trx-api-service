import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CustomerModule } from './customer/customer.module';
import { OwnerModule } from './owner/owner.module';
import { ProductModule } from './product/product.modue';
import { QueueModule } from './queue/queue.module';
import { PrismaModule } from './prisma/prisma.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { FastifyAdapter } from '@bull-board/fastify';
import { BalanceHistoryModule } from './balanceHistory/balanceHistory.module';
import { ExternalProductModule } from './externalProduct/externalProduct.module';
import { ExternalAuthModule } from './externalAuth/externalAuth.module';
import { ExternalTopupModule } from './externalTopup/externalTopup.module';
import fastifyBasicAuth from '@fastify/basic-auth';

@Module({
  imports: [
    QueueModule,
    CustomerModule,
    OwnerModule,
    ProductModule,
    ExternalProductModule,
    ExternalAuthModule,
    AuthModule,
    PrismaModule,
    BalanceHistoryModule,
    ExternalTopupModule,

    BullBoardModule.forRoot({
      route: '/queues',
      adapter: FastifyAdapter,
      middleware: async (app: any) => {
        // Define validator
        const validate = async (username: string, password: string, req: any, reply: any) => {
          if (
            username === process.env.BULL_USERNAME &&
            password === process.env.BULL_PASSWORD
          ) {
            return;
          }
          throw new Error('Winter is coming');
        };

        // Register basic-auth
        await app.register(fastifyBasicAuth, { validate });

        app.after(() => {
          app.addHook('onRequest', async (req, reply) => {
            if (req.url.startsWith('/queues')) {
              console.log('going to queus')
              // This will trigger @fastify/basic-auth
              await app.basicAuth(req, reply);
            }
          });
        });
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
