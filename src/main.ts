import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Queue } from 'bull';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import multiPart from '@fastify/multipart';

dotenv.config();
async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter();
  
  // Register the multipart plugin for file uploads
  fastifyAdapter.register(multiPart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );
  // app.useGlobalPipes(new ValidationPipe());


  app.enableCors();
  await app.listen(8080, '0.0.0.0');
}
bootstrap();
