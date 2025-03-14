import * as crypto from 'crypto';

export default function generateSignature(username, apiKey, name) {
  return crypto
    .createHash('md5')
    .update(username + apiKey + name)
    .digest('hex');
}
