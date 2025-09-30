import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import * as crypto from 'crypto'


export async function validateDto<T>(
  dtoClass: new () => T,
  body: any,
  options = {
    whitelist: true,
    forbidNonWhitelisted: true,
  }
): Promise<{ errors: string[]; dto: T }> {
  const dto: any = plainToInstance(dtoClass, body);
  const validationErrors = await validate(dto, options);
  console.log(validationErrors, "errors")


  const errors = validationErrors.map(
    (err) => {
      const constraints = err.constraints || {}

      return `${constraints[Object.keys(constraints)[0]]}`
    }
  );

  return { errors, dto };
}

export function verifyPayload(body: any, signature: string): boolean {
  const expectedSig = signPayload(body);

  console.log(signature)
  console.log(expectedSig)

  const sigBuf = Buffer.from(signature || '', 'hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');

  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, sigBuf);
}

export function verifyPayloadAdmin(body: any, signature: string, apiKey: string): boolean {
  const expectedSig = signPayloadAdmin(body, apiKey);

  const sigBuf = Buffer.from(signature || '', 'hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');

  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, sigBuf);
}

export function signPayload(body: any) {
  const secret = process.env.PAYLOAD_SECRET || ''
  const bodyString = JSON.stringify(body);
  return crypto
    .createHmac("sha256", secret)
    .update(bodyString)
    .digest("hex");
}

export function signPayloadAdmin(body: any, apiKey: string) {

  const bodyString = JSON.stringify(body);
  return crypto
    .createHmac("sha256", apiKey)
    .update(bodyString)
    .digest("hex");
}

export function encryptSecret(secret: string) {
  const key = process.env.PAYLOAD_SECRET || ''

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptSecret(encryptedSecret: string) {
  const key = process.env.PAYLOAD_SECRET || ''

  const [ivHex, encrypted] = encryptedSecret.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}