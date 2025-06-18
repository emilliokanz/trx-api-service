import * as crypto from 'crypto';

export default function generateSignature(username:string, apiKey:string, name:string, type?: string, desc?: string) {
  if(type == "BS"){
    return crypto
    .createHash('md5')
    .update(username + apiKey + desc)
    .digest('hex');
  }else {
    return crypto
    .createHash('md5')
    .update(username + apiKey + name)
    .digest('hex');
  }
}
