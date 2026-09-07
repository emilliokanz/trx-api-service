/**
 * Dev helper: boots the Nest app without listening and dumps the OpenAPI
 * document to openapi.json. Run with: npx ts-node -r tsconfig-paths/register src/swagger/generate-spec.ts
 */
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { AppModule } from '../app.module';
import { buildSwaggerDocument } from './swagger.setup';

dotenv.config();

async function main() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: false },
  );
  const document = buildSwaggerDocument(app);
  fs.writeFileSync('openapi.json', JSON.stringify(document, null, 2));
  console.log('paths:', Object.keys(document.paths).length);
  await app.close();
  process.exit(0);
}

main();
