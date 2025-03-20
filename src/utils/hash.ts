import * as bcrypt from 'bcrypt';

export default async function hash(string: string) {
  const salt = await bcrypt.genSalt(10);
  const hashedString = await bcrypt.hash(string, salt);

  return hashedString;
}
