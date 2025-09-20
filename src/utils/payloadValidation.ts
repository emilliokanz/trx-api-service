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
  const dto : any = plainToInstance(dtoClass, body);
  const validationErrors = await validate(dto, options);
  console.log(validationErrors, "errors")


  const errors = validationErrors.map(
    (err) => { 
      const constraints = err.constraints || {}

      return`${constraints[Object.keys(constraints)[0]]}`
    }
  );

  return { errors, dto };
}

export async function verifyPayload(body: any, signature: string){
  const expectedSig = signPayload(body);
  return crypto.timingSafeEqual(
    Buffer.from(expectedSig, "hex"),
    Buffer.from(signature, "hex")
  );
}

function signPayload(body: any) {
  const bodyString = JSON.stringify(body);
  const secret = process.env.PAYLOAD_SECRET || ''
  return crypto
    .createHmac("sha256", secret)
    .update(bodyString)
    .digest("hex");
}