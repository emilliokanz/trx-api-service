import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/**
 * Name of the security scheme carrying the JWT issued by
 * `POST /api/v1/auth/login` (ExternalAuthController).
 *
 * NOTE: `AuthGuard` reads `request.headers.authorization` and passes it straight
 * to `JwtService.verifyAsync`, so the header value is the RAW token -- there is
 * no `Bearer ` prefix. That is why this is declared as an apiKey scheme instead
 * of `addBearerAuth()`: swagger-ui would otherwise prepend `Bearer ` and every
 * request would fail verification.
 */
export const JWT_AUTH = 'access-token';

/** `x-username` header, used together with `x-sign` for API-key based access. */
export const API_USERNAME = 'x-username';

/** `x-sign` header: HMAC-SHA256 hex digest of the JSON body. */
export const API_SIGNATURE = 'x-sign';

const DESCRIPTION = [
  'Transaction / top-up API service.',
  '',
  '## Authentication',
  '',
  'Call `POST /api/v1/auth/login` to obtain a JWT, then send it in the',
  '`authorization` header **without** the `Bearer ` prefix -- the guard verifies',
  'the header value verbatim.',
  '',
  'Machine-to-machine endpoints (those under `/api/v1/tx/ext/...`) accept the',
  '`x-username` + `x-sign` header pair instead of a JWT. `x-sign` is the',
  'HMAC-SHA256 hex digest of the exact JSON request body signed with the',
  "caller's API key (see `POST /api/v1/auth/api-key`).",
  '',
  'A few endpoints (`/api/v1/tx/request-web`, `/api/v1/external-topup/create-topup`,',
  '`/api/v1/external-topup/update-topup`) require BOTH a JWT and an `x-sign`',
  'header over the body.',
  '',
  '## Response envelope',
  '',
  'Most endpoints answer with `{ message, data, errorCode }`. An `errorCode` of',
  '`"0000"` means success; any other code maps to an entry in',
  '`src/lib/errorCodes.ts` (e.g. `1000` wrong credential, `1002` insufficient',
  'balance, `4012` signature not verified).',
].join('\n');

/** Builds the OpenAPI document without mounting the UI (used by generate-spec.ts). */
export function buildSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('TRX API Service')
    .setDescription(DESCRIPTION)
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'authorization',
        in: 'header',
        description:
          'Raw JWT returned by POST /api/v1/auth/login. Do NOT prefix it with "Bearer ".',
      },
      JWT_AUTH,
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-username',
        in: 'header',
        description: 'Username of the API consumer. Used together with x-sign.',
      },
      API_USERNAME,
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-sign',
        in: 'header',
        description: 'HMAC-SHA256 hex signature of the JSON request body.',
      },
      API_SIGNATURE,
    )
    .addTag('Auth', 'Login, registration, API keys and referral management')
    .addTag('External Transaction', 'Transaction requests, balance and history')
    .addTag('External Product', 'Product catalogue for external consumers')
    .addTag('External Topup', 'Bank accounts and balance top-up requests')
    .addTag('Itemku Transaction', 'Itemku order / transaction operations')
    .addTag('Itemku Product', 'Itemku product catalogue')
    .addTag('Customer', 'Internal customer management')
    .addTag('Owner', 'Owner management')
    .addTag('Balance History', 'Customer balance mutation history')
    .build();

  // AuthController (/auth/login, /auth/register) is kept out of the spec with
  // @ApiExcludeController -- JWTs are issued by ExternalAuthController instead.
  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication): void {
  const document = buildSwaggerDocument(app);

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
