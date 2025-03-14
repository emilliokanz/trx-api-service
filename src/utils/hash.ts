import * as bcrypt from 'bcrypt';

export default async function hash(apiKey: string) {
  const salt = await bcrypt.genSalt(10);
  const hashedApiKey = await bcrypt.hash(apiKey, salt);

  return hashedApiKey;
}
